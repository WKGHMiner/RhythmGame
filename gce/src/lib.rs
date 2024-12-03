mod tree;


struct Node<T> {
    left: Link<T>,
    right: Link<T>,
    next: Link<T>,
    item: T,
}


type Link<T> = Option<Box<Node<T>>>;


pub struct Tree<T> {
    root: Link<T>
}


fn open_img(path: &str) {
    let reader = match image::ImageReader::open(path) {
        Ok(reader) => match reader.decode() {
            Ok(res) => res,
            Err(e) => panic!("Decode error: {}", e),
        },
        Err(e) => panic!("Cannot open [{}]: {}", path, e),
    };

    let buffer = reader.as_rgb8().unwrap();
    for (_, _, pixel) in buffer.enumerate_pixels() {}
}


#[cfg(test)]
mod test {
    use crate::*;


    #[test]
    fn test_obtree() {
        let mut tree = Tree::new();
        tree.insert(1);
        tree.insert(0);
        tree.insert(2);
        tree.insert(5);
        tree.insert(4);
        println!("{}", tree.size());
    }
}