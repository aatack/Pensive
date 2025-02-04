use json::JsonValue;
use rusqlite::Connection;
use std::{cell::OnceCell, time::SystemTime};
use uuid::Uuid;

pub struct Store {
    path: String,
    connection_cell: OnceCell<Connection>,
}

pub struct StoreEntity {
    timestamp: SystemTime,
    entity: Uuid,
    key: String,
    value: JsonValue,
}

pub struct StoreResource {
    timestamp: SystemTime,
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
            let connection = Connection::open(self.path.clone()).unwrap();

            // Set up the entities table
            connection
                .execute(
                    "create table if not exists entities (
                        timestamp integer not null,
                        entity text not null,
                        key text not null,
                        value text not null
                    );",
                    [],
                )
                .unwrap();

            connection
                .execute(
                    "create index if not exists idx_entities_timestamp
                        on entities (timestamp)",
                    [],
                )
                .unwrap();

            connection
                .execute(
                    "create index if not exists idx_entities_entity
                        on entities (entity)",
                    [],
                )
                .unwrap();

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
                .unwrap();

            connection
                .execute(
                    "create index if not exists idx_resources_timestamp
                            on resources (timestamp)",
                    [],
                )
                .unwrap();

            connection
                .execute(
                    "create index if not exists idx_resources_resource
                            on resources (resource)",
                    [],
                )
                .unwrap();

            connection
        })
    }
}
