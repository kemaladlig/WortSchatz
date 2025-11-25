  export const CREATE_WORDS_TABLE = `CREATE TABLE IF NOT EXISTS words(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    german_word TEXT NOT NULL,
    article TEXT NOT NULL,
    translation TEXT NOT NULL,
    example_sentence TEXT,
    mastery_level INTEGER DEFAULT 0,
    level TEXT DEFAULT 'A1',
    last_reviewed DATETIME,
    easiness_factor REAL DEFAULT 2.5,
    interval INTEGER DEFAULT 0,
    repetitions INTEGER DEFAULT 0,
    next_review_date DATETIME
  );`;


export const CREATE_LESSONS_TABLE = `
  CREATE TABLE IF NOT EXISTS lessons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    order_index INTEGER NOT NULL,
    level TEXT DEFAULT 'A1',
    is_completed INTEGER DEFAULT 0
  );
`;

export const CREATE_SCENARIOS_TABLE = `
  CREATE TABLE IF NOT EXISTS scenarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    icon_name TEXT NOT NULL,
    color_theme TEXT NOT NULL
  );
`;

export const CREATE_PHRASES_TABLE = `
  CREATE TABLE IF NOT EXISTS phrases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    scenario_id INTEGER NOT NULL,
    german_text TEXT NOT NULL,
    english_text TEXT NOT NULL,
    audio_speed REAL DEFAULT 1.0,
    FOREIGN KEY(scenario_id) REFERENCES scenarios(id)
  );
`;
