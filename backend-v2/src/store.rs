use rusqlite::Connection;
use std::cell::OnceCell;

pub struct Store {
    path: String,
    connection_cell: OnceCell<Connection>,
}

impl Store {
    pub fn new(path: &str) -> Self {
        Self {
            path: path.to_string(),
            connection_cell: OnceCell::new(),
        }
    }

    pub fn connection(&self) -> &Connection {
        self.connection_cell.get_or_init(|| {
            let connection = Connection::open(self.path.clone())
                .expect("Failed to open connection to database file");

            connection
                .execute(
                    "",
                    [],
                )
                .expect("Failed to create entity table");

            connection
        })
    }
}
