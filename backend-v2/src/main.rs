use store::Store;

mod store;

fn main() {
    let store = Store::new("data/test.pensive");

    println!("{:p}", store.connection())
}
