import { Question } from "../models/mongo/index.js";

/**
 * Sample questions data for seeding the database
 * These are LeetCode-style coding problems for testing
 */
const sampleQuestions = [
  {
    title: "Two Sum",
    slug: "two-sum",
    description: `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.`,
    difficulty: {
      level: "Easy",
      score: 2,
    },
    examples: [
      {
        input: "nums = [2,7,11,15], target = 9",
        output: "[0,1]",
        explanation: "Because nums[0] + nums[1] == 9, we return [0, 1].",
      },
      {
        input: "nums = [3,2,4], target = 6",
        output: "[1,2]",
      },
      {
        input: "nums = [3,3], target = 6",
        output: "[0,1]",
      },
    ],
    constraints: {
      timeLimit: 2000,
      memoryLimit: 256,
      inputConstraints: [
        "2 <= nums.length <= 10^4",
        "-10^9 <= nums[i] <= 10^9",
        "-10^9 <= target <= 10^9",
        "Only one valid answer exists.",
      ],
    },
    testCases: [
      {
        input: "[2,7,11,15]\n9",
        expectedOutput: "[0,1]",
        isHidden: false,
      },
      {
        input: "[3,2,4]\n6",
        expectedOutput: "[1,2]",
        isHidden: false,
      },
      {
        input: "[3,3]\n6",
        expectedOutput: "[0,1]",
        isHidden: true,
      },
      {
        input: "[1,2,3,4,5,6,7,8,9,10]\n19",
        expectedOutput: "[8,9]",
        isHidden: true,
      },
    ],
    tags: ["array", "hash-table"],
    category: "Array",
    hints: [
      "A really brute force way would be to search for all possible pairs of numbers but that would be too slow. Again, it's best to try out brute force solutions for just for completeness. It is from these brute force solutions that you can come up with optimizations.",
      "So, if we fix one of the numbers, say x, we have to scan the entire array to find the next number y which is value - x where value is the input parameter. Can we change our array somehow so that this search becomes faster?",
      "The second train of thought is, without changing the array, can we use additional space somehow? Like maybe a hash map to speed up the search?",
    ],
    isActive: true,
    isVerified: true,
    source: "LeetCode 1. Two Sum",
  },
  {
    title: "Add Two Numbers",
    slug: "add-two-numbers",
    description: `You are given two non-empty linked lists representing two non-negative integers. The digits are stored in reverse order, and each of their nodes contains a single digit. Add the two numbers and return the sum as a linked list.

You may assume the two numbers do not contain any leading zero, except the number 0 itself.`,
    difficulty: {
      level: "Medium",
      score: 5,
    },
    examples: [
      {
        input: "l1 = [2,4,3], l2 = [5,6,4]",
        output: "[7,0,8]",
        explanation: "342 + 465 = 807.",
      },
      {
        input: "l1 = [0], l2 = [0]",
        output: "[0]",
      },
      {
        input: "l1 = [9,9,9,9,9,9,9], l2 = [9,9,9,9]",
        output: "[8,9,9,9,0,0,0,1]",
      },
    ],
    constraints: {
      timeLimit: 3000,
      memoryLimit: 256,
      inputConstraints: [
        "The number of nodes in each linked list is in the range [1, 100].",
        "0 <= Node.val <= 9",
        "It is guaranteed that the list represents a number that does not have leading zeros.",
      ],
    },
    testCases: [
      {
        input: "[2,4,3]\n[5,6,4]",
        expectedOutput: "[7,0,8]",
        isHidden: false,
      },
      {
        input: "[0]\n[0]",
        expectedOutput: "[0]",
        isHidden: false,
      },
      {
        input: "[9,9,9,9,9,9,9]\n[9,9,9,9]",
        expectedOutput: "[8,9,9,9,0,0,0,1]",
        isHidden: true,
      },
    ],
    tags: ["linked-list", "math", "recursion"],
    category: "Linked List",
    hints: [
      "Think about how you would add two numbers on paper. Start from the least significant digit.",
      "Don't forget to handle the carry when the sum is greater than 9.",
      "What happens when one list is longer than the other?",
    ],
    isActive: true,
    isVerified: true,
    source: "LeetCode 2. Add Two Numbers",
  },
  {
    title: "Longest Substring Without Repeating Characters",
    slug: "longest-substring-without-repeating-characters",
    description: `Given a string s, find the length of the longest substring without repeating characters.`,
    difficulty: {
      level: "Medium",
      score: 6,
    },
    examples: [
      {
        input: 's = "abcabcbb"',
        output: "3",
        explanation: 'The answer is "abc", with the length of 3.',
      },
      {
        input: 's = "bbbbb"',
        output: "1",
        explanation: 'The answer is "b", with the length of 1.',
      },
      {
        input: 's = "pwwkew"',
        output: "3",
        explanation: 'The answer is "wke", with the length of 3.',
      },
    ],
    constraints: {
      timeLimit: 2000,
      memoryLimit: 256,
      inputConstraints: [
        "0 <= s.length <= 5 * 10^4",
        "s consists of English letters, digits, symbols and spaces.",
      ],
    },
    testCases: [
      {
        input: "abcabcbb",
        expectedOutput: "3",
        isHidden: false,
      },
      {
        input: "bbbbb",
        expectedOutput: "1",
        isHidden: false,
      },
      {
        input: "pwwkew",
        expectedOutput: "3",
        isHidden: true,
      },
      {
        input: "",
        expectedOutput: "0",
        isHidden: true,
      },
    ],
    tags: ["hash-table", "string", "sliding-window"],
    category: "String",
    hints: [
      "Use a sliding window technique.",
      "Keep track of characters you've seen in the current window.",
      "When you encounter a repeating character, move the start of the window.",
    ],
    isActive: true,
    isVerified: true,
    source: "LeetCode 3. Longest Substring Without Repeating Characters",
  },
  {
    title: "Median of Two Sorted Arrays",
    slug: "median-of-two-sorted-arrays",
    description: `Given two sorted arrays nums1 and nums2 of size m and n respectively, return the median of the two sorted arrays.

The overall run time complexity should be O(log (m+n)).`,
    difficulty: {
      level: "Hard",
      score: 9,
    },
    examples: [
      {
        input: "nums1 = [1,3], nums2 = [2]",
        output: "2.00000",
        explanation: "merged array = [1,2,3] and median is 2.",
      },
      {
        input: "nums1 = [1,2], nums2 = [3,4]",
        output: "2.50000",
        explanation:
          "merged array = [1,2,3,4] and median is (2 + 3) / 2 = 2.5.",
      },
    ],
    constraints: {
      timeLimit: 5000,
      memoryLimit: 512,
      inputConstraints: [
        "nums1.length == m",
        "nums2.length == n",
        "0 <= m <= 1000",
        "0 <= n <= 1000",
        "1 <= m + n <= 2000",
        "-10^6 <= nums1[i], nums2[i] <= 10^6",
      ],
    },
    testCases: [
      {
        input: "[1,3]\n[2]",
        expectedOutput: "2.00000",
        isHidden: false,
      },
      {
        input: "[1,2]\n[3,4]",
        expectedOutput: "2.50000",
        isHidden: false,
      },
      {
        input: "[0,0]\n[0,0]",
        expectedOutput: "0.00000",
        isHidden: true,
      },
      {
        input: "[]\n[1]",
        expectedOutput: "1.00000",
        isHidden: true,
      },
    ],
    tags: ["array", "binary-search", "divide-and-conquer"],
    category: "Binary Search",
    hints: [
      "The key insight is to partition both arrays such that the left partition contains exactly half of the total elements.",
      "Use binary search on the smaller array for efficiency.",
      "Ensure that every element in the left partition is less than or equal to every element in the right partition.",
    ],
    isActive: true,
    isVerified: true,
    source: "LeetCode 4. Median of Two Sorted Arrays",
  },
  {
    title: "Valid Parentheses",
    slug: "valid-parentheses",
    description: `Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.`,
    difficulty: {
      level: "Easy",
      score: 3,
    },
    examples: [
      {
        input: 's = "()"',
        output: "true",
      },
      {
        input: 's = "()[]{}"',
        output: "true",
      },
      {
        input: 's = "(]"',
        output: "false",
      },
    ],
    constraints: {
      timeLimit: 1000,
      memoryLimit: 256,
      inputConstraints: [
        "1 <= s.length <= 10^4",
        "s consists of parentheses only '()[]{}'.",
      ],
    },
    testCases: [
      {
        input: "()",
        expectedOutput: "true",
        isHidden: false,
      },
      {
        input: "()[]{}",
        expectedOutput: "true",
        isHidden: false,
      },
      {
        input: "(]",
        expectedOutput: "false",
        isHidden: false,
      },
      {
        input: "([)]",
        expectedOutput: "false",
        isHidden: true,
      },
      {
        input: "{[]}",
        expectedOutput: "true",
        isHidden: true,
      },
    ],
    tags: ["string", "stack"],
    category: "Stack",
    hints: [
      "Use a stack to keep track of opening brackets.",
      "When you encounter a closing bracket, check if it matches the most recent opening bracket.",
      "If all brackets are properly matched, the stack should be empty at the end.",
    ],
    isActive: true,
    isVerified: true,
    source: "LeetCode 20. Valid Parentheses",
  },
];

/**
 * Seed the database with sample questions
 */
export async function seedQuestions() {
  try {
    console.log("Starting question seeding...");

    // Check if questions already exist
    const existingQuestions = await Question.countDocuments();
    if (existingQuestions > 0) {
      console.log(
        `Database already contains ${existingQuestions} questions. Skipping seeding.`
      );
      return;
    }

    // Prepare test cases: ensure input field is string
    const normalizedQuestions = sampleQuestions.map((q) => {
      const testCases = q.testCases.map((tc) => ({
        input: tc.input || "",
        expectedOutput: tc.expectedOutput,
        isHidden: tc.isHidden,
      }));
      return { ...q, testCases };
    });
    // Insert sample questions
    const insertedQuestions = await Question.insertMany(normalizedQuestions);
    console.log(`Successfully seeded ${insertedQuestions.length} questions`);

    // Log the created questions
    insertedQuestions.forEach((q) => {
      console.log(`- ${q.title} (${q.difficulty.level}) - ${q.slug}`);
    });

    return insertedQuestions;
  } catch (error) {
    console.error("Error seeding questions:", error);
    throw error;
  }
}

/**
 * Clear all questions from the database (use with caution)
 */
export async function clearQuestions() {
  try {
    const result = await Question.deleteMany({});
    console.log(`Deleted ${result.deletedCount} questions`);
    return result;
  } catch (error) {
    console.error("Error clearing questions:", error);
    throw error;
  }
}

export default {
  seedQuestions,
  clearQuestions,
  sampleQuestions,
};
