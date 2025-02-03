use json::JsonValue;
use rusqlite::Connection;
use std::{cell::OnceCell, time::Instant};
use uuid::Uuid;

pub struct Store {
    path: String,
    connection_cell: OnceCell<Connection>,
}

pub struct StoreEntity {
    timestamp: Instant,
    entity: Uuid,
    key: String,
    value: JsonValue,
}

pub struct StoreResource {
    timestamp: Instant,
    resource: Uuid,
    data: Vec<u8>,
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

            // Set up the entities table
            connection
                .execute(
                    "create table if not exists entities (
                        timestamp text not null,
                        entity text not null,
                        key text not null,
                        value text not null
                    );",
                    [],
                )
                .expect("Failed to create entity table");

            connection
                .execute(
                    "create index if not exists idx_entities_timestamp
                        on entities (timestamp)",
                    [],
                )
                .expect("Failed to create index on timestamp");

            connection
                .execute(
                    "create index if not exists idx_entities_entity
                        on entities (entity)",
                    [],
                )
                .expect("Failed to create index on entity");

            // Set up the resources table
            connection
                .execute(
                    "create table if not exists resources (
                        timestamp text not null,
                        resource text not null,
                        data blob not null
                    );",
                    [],
                )
                .expect("Failed to create entity table");

            connection
                .execute(
                    "create index if not exists idx_resources_timestamp
                            on resources (timestamp)",
                    [],
                )
                .expect("Failed to create index on timestamp");

            connection
                .execute(
                    "create index if not exists idx_resources_resource
                            on resources (resource)",
                    [],
                )
                .expect("Failed to create index on entity");

            connection
        })
    }
}
