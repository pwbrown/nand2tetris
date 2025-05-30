/**
 * Generate solvable 15-puzzle's and output a block of Jack code that can be
 * copied and pasted into the ../sliding-puzzle/Utils.jack file
 * Author  : Philip Brown
 */

/** Number of puzzles that this script should generate */
const PUZZLE_COUNT = 30;

const main = () => {
    const puzzles = [];
    let skipped = 0;
    while (puzzles.length < PUZZLE_COUNT) {
        const candidate = generateShuffledPositionsArray();
        const solvable = isSolvable(candidate);
        if (solvable) {
            puzzles.push(candidate);
        } else {
            skipped++;
        }
    }
    console.log(`Generated ${puzzles.length} solvable puzzles`);
    console.log(`Skipped ${skipped} unsolvable puzzles`);

    console.log('Jack Code to be copied and pasted:\n');

    console.log(`let num = Utils.mod(seed, ${puzzles.length});`);
    /** Generate the Jack code */
    for (let i = 0; i < puzzles.length; i++) {
        const puzzle = puzzles[i];
        /** Convert puzzle positions into an ASCII string using letters A-P */
        const posString = String.fromCharCode(...puzzle.map((num) => num + 65));
        console.log(`if (num = ${i}) { let posString = "${posString}"; }`);
    }

    console.log('\nEnd of Generated Jack Code');
};

/**
 * Determines if a puzzle is solvable
 * This implementation is based off https://www.geeksforgeeks.org/check-instance-15-puzzle-solvable/
 * @param {number[]} puzzle array of puzzle positions
 */
const isSolvable = (positions) => {
    /** Convert my positions array implementation into the exepcted format */
    const puzzle = convertPositionsToPuzzle(positions);
    
    const invCount = getInvCount(puzzle);
    const isInvCountEven = invCount % 2 === 0;

    const pos = findBlankSpaceFromBottom(puzzle);
    const isPosEven = pos % 2 === 0;

    return isPosEven !== isInvCountEven;
}

/**
 * In the Jack version of the sliding puzzle, the positions array
 * is used to assign the position to each number, so to make the algorithm above
 * work, I need to convert those positions to a final array where
 * 0 represents the empty space, and 1-15 are the labeled tiles
 */
const convertPositionsToPuzzle = (positions) => {
    const puzzle = [];
    for (let i = 0; i < positions.length; i++) {
        const pos = positions[i];
        /** Treat 16th tile as the empty one */
        if (i === positions.length - 1) {
            puzzle[pos] = 0;
        } else {
            puzzle[pos] = i + 1;
        }
    }
    return puzzle;
}

// Counts the number of inversions in the given puzzle
const getInvCount = (puzzle) => {
    let count = 0;
    for (let i = 0; i < 15; i++) {
        for (let j = i + 1; j < 16; j++) {
            if (puzzle[j] && puzzle[i] && puzzle[i] > puzzle[j]) {
                count++;
            }
        }
    }
    return count;
}

// Find space from bottom where the blank space is
const findBlankSpaceFromBottom = (puzzle) => {
    for (let i = 0; i < 15; i++) {
        if (puzzle[i] === 0) {
            const row = Math.floor(i / 4);
            return 4 - row;
        }
    }
    /** Shouldn't hit this line */
    return 0;
}

/**
 * Generate array of shuffled grid positions: Fisher-Yates Shuffle implementation
 * https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
 * @param {*} arr 
 */
const generateShuffledPositionsArray = () => {
    /** Array to represent the grid */
    const arr = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = arr[i];
        arr[i] = arr[j];
        arr[j] = temp;
    }
    return arr;
}

main();