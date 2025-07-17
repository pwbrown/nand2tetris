[Back](../README.md)

# Course 2 Project 12

Project 12 involves building the complete Jack Operating System consisting of 8 classes:
- `Array` - Abstraction for allocating and de-allocating memory for arrays
- `Keyboard` - Functions for interacting with the keyboard input
- `Math` - Functions for implementing common math operations including the critical `multiply` and `divide` algorithms which are not implemented in hardware.
- `Memory` - Functions for peeking and poking memory, allocating new blocks of memory, de-allocating existing blocks of memory, and defragging the memory.
- `Output` - Functions for displaying text to the screen with a bitmap font provided by the course.
- `Screen` - Functions for displaying content to the screen output including pixels, lines, rectangles, and circles.
- `String` - Class for building and manipulating a string.
- `Sys` - Core class that serves as the entrypoint to the operating system and includes helper functions to wait and halt execution.

All of these classes are implemented in the [os](../n2t/os) folder of the n2t CLI tool.

TODO: Need to automate the compilation and assembly of the OS into the n2t CLI tool.