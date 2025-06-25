# database/crud.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, and_, or_, func
from sqlalchemy.orm import selectinload, joinedload
from typing import List, Optional, Dict, Any
from .models import (
    Language, Category, CategoryTranslation, WordType, WordTypeTranslation,
    DifficultyLevel, DifficultyLevelTranslation, KazakhWord, Pronunciation,
    Translation, WordImage, ExampleSentence, ExampleSentenceTranslation, WordSound
)

from sqlalchemy import select, update, delete, and_, or_, func
from sqlalchemy.orm import selectinload, joinedload
from typing import List, Optional, Dict, Any
from .models import (
    ExampleSentence, ExampleSentenceTranslation, Language, KazakhWord
)

# === In schemas.py file ===
# Add these imports at the top:
from pydantic import BaseModel, Field, validator
from datetime import datetime
from typing import List, Optional, Dict, Any

# === In main.py file ===
# Add these imports to your existing imports:
from sqlalchemy import select, func, or_, and_
from fastapi import Path  # Add this to your existing FastAPI imports

# And these to your database.schemas import:
from database.schemas import (
    # ... your existing imports ...
    ExampleSentenceCreate, ExampleSentenceUpdate, ExampleSentenceDetailResponse,
    ExampleSentenceTranslationCreate, ExampleSentenceTranslationUpdate,
    ExampleSentenceListResponse, BulkExampleSentenceCreate,
    SearchExampleSentencesRequest, ExampleSentenceStats
)

# === In learning_crud.py (if you plan to integrate with learning features) ===
# Add this import:
from .models import ExampleSentence, ExampleSentenceTranslation


class LanguageCRUD:
    @staticmethod
    async def get_all(db: AsyncSession, active_only: bool = True) -> List[Language]:
        """Get all languages"""
        query = select(Language)
        if active_only:
            query = query.where(Language.is_active == True)
        result = await db.execute(query.order_by(Language.language_name))
        return result.scalars().all()

    @staticmethod
    async def get_by_code(db: AsyncSession, language_code: str) -> Optional[Language]:
        """Get language by code"""
        result = await db.execute(select(Language).where(Language.language_code == language_code))
        return result.scalar_one_or_none()

    @staticmethod
    async def get_by_id(db: AsyncSession, language_id: int) -> Optional[Language]:
        """Get language by ID"""
        result = await db.execute(select(Language).where(Language.id == language_id))
        return result.scalar_one_or_none()


class CategoryCRUD:
    @staticmethod
    async def get_all_with_translations(
            db: AsyncSession,
            language_code: str = "en",
            active_only: bool = True
    ) -> List[Category]:
        """Get all categories with translations for specified language"""
        query = (
            select(Category)
            .outerjoin(CategoryTranslation)
            .outerjoin(Language)
            .options(
                selectinload(Category.translations).joinedload(CategoryTranslation.language)
            )
            .where(
                and_(
                    Category.is_active == True if active_only else True,
                    or_(
                        Language.language_code == language_code,
                        Language.language_code == None  # Include categories without translations
                    )
                )
            )
            .order_by(Category.category_name)
        )

        result = await db.execute(query)
        categories = result.scalars().all()

        # Filter translations by language
        for category in categories:
            category.translations = [
                t for t in category.translations
                if t.language.language_code == language_code
            ]

        return categories

    @staticmethod
    async def get_by_id(
            db: AsyncSession,
            category_id: int,
            language_code: str = "en"
    ) -> Optional[Category]:
        """Get category by ID with translations"""
        query = (
            select(Category)
            .outerjoin(CategoryTranslation)
            .outerjoin(Language)
            .options(
                selectinload(Category.translations).joinedload(CategoryTranslation.language)
            )
            .where(
                and_(
                    Category.id == category_id,
                    or_(
                        Language.language_code == language_code,
                        Language.language_code == None  # Include categories without translations
                    )
                )
            )
        )

        result = await db.execute(query)
        category = result.scalar_one_or_none()

        if category and category.translations:
            category.translations = [
                t for t in category.translations
                if t.language.language_code == language_code
            ]

        return category


class WordTypeCRUD:
    @staticmethod
    async def get_all_with_translations(
            db: AsyncSession,
            language_code: str = "en",
            active_only: bool = True
    ) -> List[WordType]:
        """Get all word types with translations"""
        query = (
            select(WordType)
            .options(
                selectinload(WordType.translations).joinedload(WordTypeTranslation.language)
            )
        )
        if active_only:
            query = query.where(WordType.is_active == True)

        result = await db.execute(query.order_by(WordType.type_name))
        word_types = result.scalars().all()

        for word_type in word_types:
            word_type.translations = [
                t for t in word_type.translations
                if t.language.language_code == language_code
            ]

        return word_types


class DifficultyLevelCRUD:
    @staticmethod
    async def get_all_with_translations(
            db: AsyncSession,
            language_code: str = "en",
            active_only: bool = True
    ) -> List[DifficultyLevel]:
        """Get all difficulty levels with translations"""
        query = (
            select(DifficultyLevel)
            .options(
                selectinload(DifficultyLevel.translations).joinedload(DifficultyLevelTranslation.language)
            )
        )
        if active_only:
            query = query.where(DifficultyLevel.is_active == True)

        result = await db.execute(query.order_by(DifficultyLevel.level_number))
        levels = result.scalars().all()

        for level in levels:
            level.translations = [
                t for t in level.translations
                if t.language.language_code == language_code
            ]

        return levels


class KazakhWordCRUD:
    @staticmethod
    async def create(
            db: AsyncSession,
            kazakh_word: str,
            kazakh_cyrillic: str,
            word_type_id: int,
            category_id: int,
            difficulty_level_id: int = 1
    ) -> KazakhWord:
        """Create a new Kazakh word"""
        db_word = KazakhWord(
            kazakh_word=kazakh_word,
            kazakh_cyrillic=kazakh_cyrillic,
            word_type_id=word_type_id,
            category_id=category_id,
            difficulty_level_id=difficulty_level_id
        )
        db.add(db_word)
        await db.commit()
        await db.refresh(db_word)
        return db_word

    @staticmethod
    async def get_by_id(db: AsyncSession, word_id: int) -> Optional[KazakhWord]:
        """Get word by ID"""
        result = await db.execute(select(KazakhWord).where(KazakhWord.id == word_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def get_by_id_full(
            db: AsyncSession,
            word_id: int,
            language_code: str = "en"
    ) -> Optional[KazakhWord]:
        """Get word by ID with all related data"""
        result = await db.execute(
            select(KazakhWord)
            .options(
                joinedload(KazakhWord.word_type).selectinload(WordType.translations).joinedload(
                    WordTypeTranslation.language),
                joinedload(KazakhWord.category).selectinload(Category.translations).joinedload(
                    CategoryTranslation.language),
                joinedload(KazakhWord.difficulty_level).selectinload(DifficultyLevel.translations).joinedload(
                    DifficultyLevelTranslation.language),
                selectinload(KazakhWord.translations).joinedload(Translation.language),
                selectinload(KazakhWord.pronunciations).joinedload(Pronunciation.language),
                selectinload(KazakhWord.images),
                selectinload(KazakhWord.example_sentences).selectinload(ExampleSentence.translations).joinedload(
                    ExampleSentenceTranslation.language)
            )
            .where(KazakhWord.id == word_id)
        )
        word = result.scalar_one_or_none()

        if word:
            # Filter translations by language
            word.translations = [
                t for t in word.translations
                if t.language.language_code == language_code
            ]
            word.pronunciations = [
                p for p in word.pronunciations
                if p.language.language_code == language_code
            ]

            # Filter example sentence translations
            for sentence in word.example_sentences:
                sentence.translations = [
                    t for t in sentence.translations
                    if t.language.language_code == language_code
                ]

        return word

    @staticmethod
    async def get_all_paginated(
            db: AsyncSession,
            skip: int = 0,
            limit: int = 100,
            category_id: Optional[int] = None,
            word_type_id: Optional[int] = None,
            difficulty_level_id: Optional[int] = None,
            language_code: str = "en"
    ) -> List[KazakhWord]:
        """Get paginated list of words with filters"""
        query = (
            select(KazakhWord)
            .options(
                joinedload(KazakhWord.word_type),
                joinedload(KazakhWord.category),
                joinedload(KazakhWord.difficulty_level),
                selectinload(KazakhWord.translations).joinedload(Translation.language),
                selectinload(KazakhWord.images)
            )
        )

        # Apply filters
        if category_id:
            query = query.where(KazakhWord.category_id == category_id)
        if word_type_id:
            query = query.where(KazakhWord.word_type_id == word_type_id)
        if difficulty_level_id:
            query = query.where(KazakhWord.difficulty_level_id == difficulty_level_id)

        # Add ordering and pagination
        query = query.offset(skip).limit(limit).order_by(KazakhWord.kazakh_word)

        result = await db.execute(query)
        words = result.scalars().all()

        # Post-process to filter translations and images
        for word in words:
            word.translations = [
                t for t in word.translations
                if t.language.language_code == language_code
            ]
            word.images = [img for img in word.images if img.is_primary]

        return words

    @staticmethod
    async def search_words(
            db: AsyncSession,
            search_term: str,
            language_code: str = "en",
            limit: int = 20
    ) -> List[KazakhWord]:
        """Search words by Kazakh word or translation"""
        # First query: Search in Kazakh words
        kazakh_query = (
            select(KazakhWord)
            .options(
                joinedload(KazakhWord.word_type),
                joinedload(KazakhWord.category),
                joinedload(KazakhWord.difficulty_level),
                selectinload(KazakhWord.translations).joinedload(Translation.language),
                selectinload(KazakhWord.images)
            )
            .where(
                or_(
                    KazakhWord.kazakh_word.ilike(f"%{search_term}%"),
                    KazakhWord.kazakh_cyrillic.ilike(f"%{search_term}%")
                )
            )
            .limit(limit)
        )

        # Second query: Search in translations
        translation_query = (
            select(KazakhWord)
            .options(
                joinedload(KazakhWord.word_type),
                joinedload(KazakhWord.category),
                joinedload(KazakhWord.difficulty_level),
                selectinload(KazakhWord.translations).joinedload(Translation.language),
                selectinload(KazakhWord.images)
            )
            .join(Translation)
            .join(Language)
            .where(
                and_(
                    Translation.translation.ilike(f"%{search_term}%"),
                    Language.language_code == language_code
                )
            )
            .limit(limit)
        )

        # Execute both queries
        kazakh_result = await db.execute(kazakh_query)
        translation_result = await db.execute(translation_query)

        kazakh_words = kazakh_result.scalars().all()
        translation_words = translation_result.scalars().all()

        # Combine and deduplicate results
        all_words_dict = {}
        for word in kazakh_words + translation_words:
            all_words_dict[word.id] = word

        all_words = list(all_words_dict.values())

        # Post-process to filter translations and images
        for word in all_words:
            word.translations = [
                t for t in word.translations
                if t.language.language_code == language_code
            ]
            word.images = [img for img in word.images if img.is_primary]

        return all_words[:limit]

    @staticmethod
    async def get_random_words(
            db: AsyncSession,
            count: int = 10,
            difficulty_level_id: Optional[int] = None,
            category_id: Optional[int] = None,
            language_code: str = "en"
    ) -> List[KazakhWord]:
        """Get random words for practice"""
        query = (
            select(KazakhWord)
            .options(
                joinedload(KazakhWord.difficulty_level),
                selectinload(KazakhWord.translations).joinedload(Translation.language),
                selectinload(KazakhWord.pronunciations).joinedload(Pronunciation.language),
                selectinload(KazakhWord.images)
            )
            .order_by(func.random())
            .limit(count)
        )

        # Apply filters
        if difficulty_level_id:
            query = query.where(KazakhWord.difficulty_level_id == difficulty_level_id)
        if category_id:
            query = query.where(KazakhWord.category_id == category_id)

        result = await db.execute(query)
        words = result.scalars().all()

        # Post-process to filter translations and images
        for word in words:
            word.translations = [
                t for t in word.translations
                if t.language.language_code == language_code
            ]
            word.pronunciations = [
                p for p in word.pronunciations
                if p.language.language_code == language_code
            ]
            word.images = [img for img in word.images if img.is_primary]

        return words


class TranslationCRUD:
    @staticmethod
    async def create(
            db: AsyncSession,
            kazakh_word_id: int,
            language_id: int,
            translation: str,
            alternative_translations: Optional[List[str]] = None
    ) -> Translation:
        """Create a new translation"""
        db_translation = Translation(
            kazakh_word_id=kazakh_word_id,
            language_id=language_id,
            translation=translation,
            alternative_translations=alternative_translations
        )
        db.add(db_translation)
        await db.commit()
        await db.refresh(db_translation)
        return db_translation


class PronunciationCRUD:
    @staticmethod
    async def create(
            db: AsyncSession,
            kazakh_word_id: int,
            language_id: int,
            pronunciation: str,
            pronunciation_system: str,
            audio_file_path: Optional[str] = None
    ) -> Pronunciation:
        """Create a new pronunciation"""
        db_pronunciation = Pronunciation(
            kazakh_word_id=kazakh_word_id,
            language_id=language_id,
            pronunciation=pronunciation,
            pronunciation_system=pronunciation_system,
            audio_file_path=audio_file_path
        )
        db.add(db_pronunciation)
        await db.commit()
        await db.refresh(db_pronunciation)
        return db_pronunciation


class WordImageCRUD:
    @staticmethod
    async def create(
            db: AsyncSession,
            kazakh_word_id: int,
            image_path: str,
            image_type: str = "illustration",
            alt_text: Optional[str] = None,
            is_primary: bool = False,
            source: Optional[str] = None
    ) -> WordImage:
        """Create a new word image"""
        db_image = WordImage(
            kazakh_word_id=kazakh_word_id,
            image_path=image_path,
            image_type=image_type,
            alt_text=alt_text,
            is_primary=is_primary,
            source=source
        )
        db.add(db_image)
        await db.commit()
        await db.refresh(db_image)
        return db_image


class ExampleSentenceCRUD:
    @staticmethod
    async def create(
            db: AsyncSession,
            kazakh_word_id: int,
            kazakh_sentence: str,
            difficulty_level: int = 1,
            usage_context: Optional[str] = None
    ) -> ExampleSentence:
        """Create a new example sentence"""
        db_sentence = ExampleSentence(
            kazakh_word_id=kazakh_word_id,
            kazakh_sentence=kazakh_sentence,
            difficulty_level=difficulty_level,
            usage_context=usage_context
        )
        db.add(db_sentence)
        await db.commit()
        await db.refresh(db_sentence)
        return db_sentence


class WordSoundCRUD:
    @staticmethod
    async def create(
        db: AsyncSession,
        kazakh_word_id: int,
        sound_path: str,
        sound_url: Optional[str] = None,
        sound_type: Optional[str] = None,
        alt_text: Optional[str] = None
    ) -> WordSound:
        db_sound = WordSound(
            kazakh_word_id=kazakh_word_id,
            sound_path=sound_path,
            sound_url=sound_url,
            sound_type=sound_type,
            alt_text=alt_text
        )
        db.add(db_sound)
        await db.commit()
        await db.refresh(db_sound)
        return db_sound

    @staticmethod
    async def get_by_word_id(db: AsyncSession, kazakh_word_id: int) -> list:
        result = await db.execute(
            select(WordSound).where(WordSound.kazakh_word_id == kazakh_word_id)
        )
        return result.scalars().all()
    
# Add these methods to your WordImageCRUD class in crud.py

class WordImageCRUD:
    @staticmethod
    async def create(
            db: AsyncSession,
            kazakh_word_id: int,
            image_path: str,
            image_type: str = "illustration",
            alt_text: Optional[str] = None,
            is_primary: bool = False,
            source: Optional[str] = None
    ) -> WordImage:
        """Create a new word image"""
        db_image = WordImage(
            kazakh_word_id=kazakh_word_id,
            image_path=image_path,
            image_type=image_type,
            alt_text=alt_text,
            is_primary=is_primary,
            source=source
        )
        db.add(db_image)
        await db.commit()
        await db.refresh(db_image)
        return db_image

    @staticmethod
    async def get_by_word_id(db: AsyncSession, kazakh_word_id: int) -> List[WordImage]:
        """Get all images for a given Kazakh word ID"""
        result = await db.execute(
            select(WordImage)
            .where(WordImage.kazakh_word_id == kazakh_word_id)
            .order_by(WordImage.is_primary.desc(), WordImage.created_at)
        )
        return result.scalars().all()

    @staticmethod
    async def get_primary_by_word_id(db: AsyncSession, kazakh_word_id: int) -> Optional[WordImage]:
        """Get the primary image for a given Kazakh word ID"""
        result = await db.execute(
            select(WordImage)
            .where(
                and_(
                    WordImage.kazakh_word_id == kazakh_word_id,
                    WordImage.is_primary == True
                )
            )
            .limit(1)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_by_id(db: AsyncSession, image_id: int) -> Optional[WordImage]:
        """Get image by ID"""
        result = await db.execute(select(WordImage).where(WordImage.id == image_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def update_primary_status(
            db: AsyncSession,
            kazakh_word_id: int,
            new_primary_image_id: int
    ) -> bool:
        """Update primary status for word images - set one as primary, others as non-primary"""
        try:
            # First, set all images for this word to non-primary
            await db.execute(
                update(WordImage)
                .where(WordImage.kazakh_word_id == kazakh_word_id)
                .values(is_primary=False)
            )
            
            # Then set the specified image as primary
            result = await db.execute(
                update(WordImage)
                .where(
                    and_(
                        WordImage.id == new_primary_image_id,
                        WordImage.kazakh_word_id == kazakh_word_id
                    )
                )
                .values(is_primary=True)
            )
            
            await db.commit()
            return result.rowcount > 0
        except Exception:
            await db.rollback()
            return False

    @staticmethod
    async def delete_by_id(db: AsyncSession, image_id: int) -> bool:
        """Delete image by ID"""
        try:
            result = await db.execute(
                delete(WordImage).where(WordImage.id == image_id)
            )
            await db.commit()
            return result.rowcount > 0
        except Exception:
            await db.rollback()
            return False
        
# Add these methods to your ExampleSentenceCRUD class in crud.py

class ExampleSentenceCRUD:
    @staticmethod
    async def create(
            db: AsyncSession,
            kazakh_word_id: int,
            kazakh_sentence: str,
            difficulty_level: int = 1,
            usage_context: Optional[str] = None
    ) -> ExampleSentence:
        """Create a new example sentence"""
        db_sentence = ExampleSentence(
            kazakh_word_id=kazakh_word_id,
            kazakh_sentence=kazakh_sentence,
            difficulty_level=difficulty_level,
            usage_context=usage_context
        )
        db.add(db_sentence)
        await db.commit()
        await db.refresh(db_sentence)
        return db_sentence

    @staticmethod
    async def get_by_id(
            db: AsyncSession,
            sentence_id: int,
            language_code: str = "en"
    ) -> Optional[ExampleSentence]:
        """Get example sentence by ID with translations"""
        result = await db.execute(
            select(ExampleSentence)
            .options(
                selectinload(ExampleSentence.translations)
                .selectinload(ExampleSentenceTranslation.language),
                selectinload(ExampleSentence.kazakh_word)
            )
            .where(ExampleSentence.id == sentence_id)
        )
        sentence = result.scalar_one_or_none()
        
        if sentence and sentence.translations:
            # Filter translations by language
            sentence.translations = [
                t for t in sentence.translations
                if t.language.language_code == language_code
            ]
        
        return sentence

    @staticmethod
    async def get_by_word_id(
            db: AsyncSession,
            word_id: int,
            language_code: str = "en"
    ) -> List[ExampleSentence]:
        """Get all example sentences for a word"""
        result = await db.execute(
            select(ExampleSentence)
            .options(
                selectinload(ExampleSentence.translations)
                .selectinload(ExampleSentenceTranslation.language)
            )
            .where(ExampleSentence.kazakh_word_id == word_id)
            .order_by(ExampleSentence.difficulty_level, ExampleSentence.created_at)
        )
        sentences = result.scalars().all()
        
        # Filter translations by language
        for sentence in sentences:
            sentence.translations = [
                t for t in sentence.translations
                if t.language.language_code == language_code
            ]
        
        return sentences

    @staticmethod
    async def update(
            db: AsyncSession,
            sentence_id: int,
            kazakh_sentence: Optional[str] = None,
            difficulty_level: Optional[int] = None,
            usage_context: Optional[str] = None
    ) -> Optional[ExampleSentence]:
        """Update example sentence"""
        update_data = {}
        if kazakh_sentence is not None:
            update_data["kazakh_sentence"] = kazakh_sentence
        if difficulty_level is not None:
            update_data["difficulty_level"] = difficulty_level
        if usage_context is not None:
            update_data["usage_context"] = usage_context
        
        if not update_data:
            return await ExampleSentenceCRUD.get_by_id(db, sentence_id)
        
        stmt = (
            update(ExampleSentence)
            .where(ExampleSentence.id == sentence_id)
            .values(**update_data)
            .returning(ExampleSentence)
        )
        
        result = await db.execute(stmt)
        await db.commit()
        return result.scalar_one_or_none()

    @staticmethod
    async def delete(db: AsyncSession, sentence_id: int) -> bool:
        """Delete example sentence"""
        stmt = delete(ExampleSentence).where(ExampleSentence.id == sentence_id)
        result = await db.execute(stmt)
        await db.commit()
        return result.rowcount > 0


class ExampleSentenceTranslationCRUD:
    @staticmethod
    async def create(
            db: AsyncSession,
            example_sentence_id: int,
            language_id: int,
            translated_sentence: str
    ) -> ExampleSentenceTranslation:
        """Create a new example sentence translation"""
        db_translation = ExampleSentenceTranslation(
            example_sentence_id=example_sentence_id,
            language_id=language_id,
            translated_sentence=translated_sentence
        )
        db.add(db_translation)
        await db.commit()
        await db.refresh(db_translation)
        return db_translation

    @staticmethod
    async def get_by_sentence_and_language(
            db: AsyncSession,
            sentence_id: int,
            language_code: str
    ) -> Optional[ExampleSentenceTranslation]:
        """Get translation by sentence ID and language code"""
        result = await db.execute(
            select(ExampleSentenceTranslation)
            .join(Language)
            .where(
                and_(
                    ExampleSentenceTranslation.example_sentence_id == sentence_id,
                    Language.language_code == language_code
                )
            )
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def update(
            db: AsyncSession,
            translation_id: int,
            translated_sentence: str
    ) -> Optional[ExampleSentenceTranslation]:
        """Update example sentence translation"""
        stmt = (
            update(ExampleSentenceTranslation)
            .where(ExampleSentenceTranslation.id == translation_id)
            .values(translated_sentence=translated_sentence)
            .returning(ExampleSentenceTranslation)
        )
        
        result = await db.execute(stmt)
        await db.commit()
        return result.scalar_one_or_none()

    @staticmethod
    async def delete(db: AsyncSession, translation_id: int) -> bool:
        """Delete example sentence translation"""
        stmt = delete(ExampleSentenceTranslation).where(
            ExampleSentenceTranslation.id == translation_id
        )
        result = await db.execute(stmt)
        await db.commit()
        return result.rowcount > 0

    @staticmethod
    async def get_all_for_sentence(
            db: AsyncSession,
            sentence_id: int
    ) -> List[ExampleSentenceTranslation]:
        """Get all translations for a sentence"""
        result = await db.execute(
            select(ExampleSentenceTranslation)
            .options(selectinload(ExampleSentenceTranslation.language))
            .where(ExampleSentenceTranslation.example_sentence_id == sentence_id)
            .order_by(ExampleSentenceTranslation.language_id)
        )
        return result.scalars().all()