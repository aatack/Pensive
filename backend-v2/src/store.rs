use json::{parse, JsonValue};
use rusqlite::{params, Connection};
use std::{
    cell::{OnceCell, RefCell},
    time::SystemTime,
};
use uuid::Uuid;

use crate::helpers::{integer_to_timestamp, timestamp_to_integer};

#[derive(Debug)]
pub struct Store {
    path: String,
    connection_cell: OnceCell<RefCell<Connection>>,
}

#[derive(Debug)]
pub struct StoreEntity {
    pub timestamp: SystemTime,
    pub entity: Uuid,
    pub key: String,
    pub value: JsonValue,
}

#[derive(Debug)]
pub struct StoreResource {
    pub timestamp: SystemTime,
    pub resource: Uuid,
    pub data: Vec<u8>,
}

impl Store {
    pub fn new(path: &str) -> Self {
        Self {
            path: path.to_string(),
            connection_cell: OnceCell::new(),
        }
    }

    pub fn write_entities(&self, entities: &[StoreEntity]) -> rusqlite::Result<()> {
        let mut connection = self.connection();
        let transaction = connection.transaction()?;

        {
            let mut statement = transaction.prepare(
                "insert into entities (timestamp, entity, key, value)
                values (?1, ?2, ?3, ?4)",
            )?;

            for entity in entities {
                statement.execute(params![
                    timestamp_to_integer(entity.timestamp),
                    entity.entity.to_string(),
                    entity.key,
                    entity.value.dump()
                ])?;
            }
        }

        transaction.commit()?;

        Ok(())
    }

    pub fn read_entities(
        &self,
        entities: &[Uuid],
    ) -> rusqlite::Result<Vec<StoreEntity>> {
        let connection = self.connection();

        if entities.is_empty() {
            return Ok(vec![]);
        }

        let placeholders = entities.iter().map(|_| "?").collect::<Vec<_>>().join(", ");

        let query = format!(
            "select timestamp, entity, key, value from entities where entity in ({})",
            placeholders
        );

        let mut statement = connection.prepare(&query)?;

        let entity_strings: Vec<String> =
            entities.iter().map(|id| id.to_string()).collect();
        let entity_refs: Vec<&dyn rusqlite::ToSql> = entity_strings
            .iter()
            .map(|id| id as &dyn rusqlite::ToSql)
            .collect();

        let rows =
            statement.query_map(rusqlite::params_from_iter(entity_refs), |row| {
                Ok(StoreEntity {
                    timestamp: integer_to_timestamp(row.get(0)?),
                    entity: Uuid::parse_str(&row.get::<_, String>(1)?).unwrap(),
                    key: row.get(2)?,
                    value: parse(&row.get::<_, String>(3)?).unwrap(),
                })
            })?;

        rows.collect()
    }

    pub fn root_entity(&self) -> rusqlite::Result<Uuid> {
        let connection = self.connection();

        connection.query_row(
            "select * from entities order by timestamp asc, entity asc",
            [],
            |row| Ok((Uuid::parse_str(&row.get::<_, String>(1).unwrap())).unwrap()),
        )
    }

    pub fn write_resources(&self, resources: &[StoreResource]) -> rusqlite::Result<()> {
        let mut connection = self.connection();
        let transaction = connection.transaction()?;

        {
            let mut statement = transaction.prepare(
            "insert into resources (timestamp, resource, data) values (?1, ?2, ?3);",
        )?;

            for resource in resources {
                statement.execute(params![
                    timestamp_to_integer(resource.timestamp),
                    resource.resource.to_string(),
                    resource.data
                ])?;
            }
        }

        transaction.commit()?;

        Ok(())
    }

    fn connection(&self) -> std::cell::RefMut<Connection> {
        let connection = self
            .connection_cell
            .get_or_init(|| {
                RefCell::new(
                    Connection::open(&self.path).expect("Failed to open database"),
                )
            })
            .borrow_mut();

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
    }
}
