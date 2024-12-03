use crate::{Tree, Node};
use std::cmp::Ordering;
use std::ptr::NonNull;
use std::ptr;


impl<T> Node<T> {
    pub fn new(item: T) -> Self {
        Self { left: None, right: None, next: None, item }
    }


    pub fn boxed(item: T) -> Box<Self> {
        Box::new(Self::new(item))
    }


    fn len(&self) -> usize {
        if let Some(next) = self.next.as_ref() {
            1 + next.len()
        } else { 1 }
    }


    fn size(&self) -> usize {
        let left = if let Some(left) = self.left.as_ref() {
            left.size()
        } else { 0 };

        let right = if let Some(right) = self.right.as_ref() {
            right.size()
        } else { 0 };

        left + right + self.len()
    }


    fn replace(&mut self, mut other: Node<T>) -> T {
        self.left = other.left.take();
        self.right = other.right.take();

        let self_ptr = ptr::from_mut(&mut self.item);
        let other_ptr = ptr::from_mut(&mut other.item);
        unsafe {
            ptr::swap(self_ptr, other_ptr);
        }

        other.item
    }


    fn push(&mut self, ptr: NonNull<T>) {
        if let Some(next) = self.next.as_mut() {
            next.push(ptr);
        } else {
            let item = unsafe { ptr.read() };
            self.next = Some(Self::boxed(item));
        }
    }


    fn pop(&mut self) -> Option<T> {
        if let Some(next) = self.next.as_mut() {
            if next.next.is_some() {
                next.pop()
            } else {
                let next = self.next.take().unwrap();

                Some(next.item)
            }
        } else { None }
    }
    

    fn pop_min(&mut self) -> Option<T> {
        if let Some(left) = self.left.as_mut() {
            if left.left.is_some() {
                left.pop_min()
            } else {
                let mut left = self.left.take().unwrap();
                self.left = left.right.take();

                Some(left.item)
            }
        } else if let Some(right) = self.right.take() {
            let item = self.replace(*right);

            Some(item)
        } else { self.pop() }
    }


    fn pop_max(&mut self) -> Option<T> {
        if let Some(right) = self.right.as_mut() {
            if right.right.is_some() {
                right.pop_max()
            } else {
                let mut right = self.right.take().unwrap();
                self.right = right.left.take();

                Some(right.item)
            }
        } else if let Some(left) = self.left.take() {
            let item = self.replace(*left);

            Some(item)
        } else { self.pop() }
    }
}


impl<T> Node<T> 
where 
    T: Ord
{
    fn insert(&mut self, ptr: NonNull<T>) {
        let item = unsafe { ptr.as_ref() };

        match self.item.cmp(item) {
            Ordering::Less => if let Some(left) = self.left.as_mut() {
                left.insert(ptr);
            } else {
                self.left = Some(Self::boxed(unsafe {ptr.read()}));
            },
            Ordering::Equal => self.push(ptr),
            Ordering::Greater => if let Some(right) = self.right.as_mut() {
                right.insert(ptr);
            } else {
                self.right = Some(Self::boxed(unsafe {ptr.read()}));
            },
        }
    }
}


impl<T> Tree<T> {
    pub fn new() -> Self {
        Self { root: None }
    }


    pub fn size(&self) -> usize {
        if let Some(root) = self.root.as_ref() {
            root.size()
        } else { 0 }
    }


    pub fn pop_min(&mut self) -> Option<T> {
        if let Some(root) = self.root.as_mut() {
            let popped = root.pop_min();
            if popped.is_some() {
                popped
            } else {
                Some(self.root.take().unwrap().item)
            }
        } else { None }
    }


    pub fn pop_max(&mut self) -> Option<T> {
        if let Some(root) = self.root.as_mut() {
            let popped = root.pop_max();
            if popped.is_some() {
                popped
            } else {
                Some(self.root.take().unwrap().item)
            }
        } else { None }
    }
}


impl<T> Tree<T>
where 
    T: Ord
{
    pub fn insert(&mut self, item: T) {
        if let Some(root) = self.root.as_mut() {
            let ptr = NonNull::new(Box::into_raw(Box::new(item))).unwrap();
            root.insert(ptr);
        } else {
            self.root = Some(Node::boxed(item))
        }
    }
}


impl<T> Default for Tree<T> {
    fn default() -> Self {
        Self::new()
    }
}