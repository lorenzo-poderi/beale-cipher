# Task

Identify the first physical line of the actual literary work in the supplied Project Gutenberg excerpt.

The excerpt begins after the Project Gutenberg start marker. Preliminary/editorial material can still appear below the marker and must be skipped.

Ignore, when they are not part of the work itself: title/subtitle, author information, introductions, prefaces, acknowledgements, author/publisher/translator notes, editorial notes, illustrations/captions, indexes, contents, summaries, character lists, chapter/book/canto lists, chapter/book/canto titles or subtitles, chapter introductions, chapter numbering, contextual dates/headings, Project Gutenberg/transcription notes and similar preliminary material.

The rule applies to poetry, drama, essays, philosophical works, religious works, letters, verse and works structured into books/cantos.

Use only the supplied text. Line numbers are 0-based.

When found return status "Done", the exact 0-based line index, the exact original line and confidence 0..1.

Do not paraphrase, correct or merge the line.

If the actual beginning is not present, return status "Not found" and null for the other fields. If uncertain, prefer "Not found".
