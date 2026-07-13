import { memo, useCallback, useEffect, useRef, useState } from "react";
import { uiadav1Quiz } from "./data/uiadav1Quiz";

const TIMED_EXAM_ID = "uiadav1-practice-exam";

const createExamTimer = (resetKey = 0) => ({
  started: false,
  running: false,
  totalSeconds: 0,
  currentQuestion: 0,
  inProgressTimes: {},
  completedTimes: {},
  answeredCount: 0,
  resetKey,
});

const formatDuration = (seconds, includeHours = false) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  const parts = [minutes, remainingSeconds];
  if (includeHours || hours > 0) parts.unshift(hours);
  return parts.map(part => String(part).padStart(2, "0")).join(":");
};

const topics = [
  {
    id: "else-if",
    icon: "⤵",
    title: "Else If Statements",
    subtitle: "Control Flow Scoping",
    color: "#00C6FF",
    sections: [
      {
        heading: "What Scope Are These Activities In?",
        content: `The <strong>Else If</strong> activity in UiPath lives inside a <strong>Flow Decision</strong> or a nested <strong>If Activity</strong> chain — it is NOT a standalone top-level activity.<br/><br/>
<strong>Correct Scoping:</strong>
<ul>
  <li>An If activity is placed in a Sequence or Flowchart</li>
  <li>Else If branches are nested If activities inside the Else branch of the outer If</li>
  <li>Each nested If has its own Then and Else scope</li>
</ul>
<strong>Important:</strong> In UiPath Studio, there is no single drag-and-drop Else If block. You manually nest an If inside the Else container of the parent If.`,
        code: `// Logical structure in UiPath:

If (score >= 90)        <- Outer If (Then branch)
  -> Log "A Grade"
Else
  If (score >= 75)      <- Nested If inside Else = "Else If"
    -> Log "B Grade"
  Else
    If (score >= 60)    <- Another nested If = second "Else If"
      -> Log "C Grade"
    Else
      -> Log "Fail"     <- Final Else`
      },
      {
        heading: "Flowchart vs Sequence Scoping",
        content: `<strong>In a Sequence:</strong> Use nested If activities. Variables from the outer scope are fully accessible inside nested Ifs.<br/><br/>
<strong>In a Flowchart:</strong> Use multiple Flow Decision nodes connected by True/False arrows. Each decision node is at the same visual level — no nesting needed.<br/><br/>
<strong>Recommendation:</strong> For more than 3 branches, prefer a Switch activity (equivalent to switch/case) or a Flowchart with multiple Flow Decisions.`,
        code: `// Switch Activity — cleaner for many branches
Switch (statusCode)
  Case 200: Log "Success"
  Case 404: Log "Not Found"
  Case 500: Log "Server Error"
  Default:  Log "Unknown Code"`
      }
    ],
    quiz: [
      {
        q: "In UiPath Studio, how do you implement an Else If condition inside a Sequence?",
        options: [
          "Drag an 'Else If' activity from the Activities panel into the Else branch",
          "Nest a second If activity inside the Else container of the first If activity",
          "Use a Flow Decision activity inside the Sequence",
          "Right-click the If activity and select 'Add Else If'"
        ],
        answer: 1,
        trap: "Options A and D are traps — UiPath has NO standalone Else If activity and no right-click 'Add Else If'. Option C is wrong because Flow Decision belongs to Flowcharts, not Sequences.",
        explanation: "You manually place an If activity inside the Else container. This is the most common exam trap since most programming languages have a native else-if keyword."
      },
      {
        q: "A variable declared inside the Then branch of an If activity — where is it accessible?",
        options: [
          "Everywhere in the containing Sequence or workflow",
          "Only inside the Then branch where it was declared",
          "In both the Then and Else branches only",
          "Only after the If activity completes"
        ],
        answer: 0,
        trap: "This is a major trap. UiPath variables are scoped to their CONTAINER (the Sequence or Flowchart), NOT to the branch. A variable in the Variables panel is accessible throughout its entire container.",
        explanation: "Variables in UiPath are scoped to their containing workflow or sequence — not to individual activity branches. The Variables panel scope determines access, not where you use the variable."
      },
      {
        q: "When should you prefer a Switch activity over nested If activities?",
        options: [
          "When the condition is a Boolean True/False check",
          "When comparing a single variable against more than 2-3 fixed discrete values",
          "When the branches contain asynchronous operations",
          "Switch and nested If are always interchangeable"
        ],
        answer: 1,
        trap: "Option A is wrong — Switch does NOT work with Boolean conditions, only discrete values (Integer, String, Enum). Option D is false; Switch requires a single variable compared to constants, making range checks impossible.",
        explanation: "Switch is ideal for multiple fixed-value comparisons (status codes, category names). For Boolean logic or ranges (>= 90), use nested If activities."
      }
    ]
  },
  {
    id: "semantic",
    icon: "✦",
    title: "Semantic Activities",
    subtitle: "AI-Powered UI Targeting & Form Automation",
    color: "#A78BFA",
    sections: [
      {
        heading: "What Are Semantic Activities?",
        content: `<strong>Semantic Activities</strong> is a category of AI-powered UI automation activities in <strong>UiPath.UIAutomation.Activities</strong> that identify and interact with UI elements by <strong>functional meaning</strong> rather than rigid attribute matching.<br/><br/>
There are two related concepts under this term:<br/>
<ul>
  <li><strong>Semantic Action Activities</strong> — a set of dedicated activities: Extract Form Data, Fill Form, Set Value, and Close Popup</li>
  <li><strong>Semantic Selectors</strong> — an AI targeting method inside the Unified Target framework (Modern Activities)</li>
</ul>
<strong>Key fact:</strong> Semantic action activities consume <strong>AI units</strong> per request. Extract Form Data, Fill Form, and Set Value each consume one AI unit. Close Popup only consumes an AI unit when <strong>AI-Enhanced mode</strong> is explicitly enabled — in standard mode it uses no AI units.`,
        code: `// Internal components used by Semantic Activities:

DOM Extractor     <- reads the full page DOM structure
Semantic Matching <- maps elements to their functional meaning
Semantic Execution <- performs the interaction on the matched element

// AI unit consumption per call:
Extract Form Data  -> 1 AI unit
Fill Form          -> 1 AI unit
Set Value          -> 1 AI unit
Close Popup        -> 0 AI units (standard mode)
Close Popup        -> 1 AI unit  (AI-Enhanced mode only)`
      },
      {
        heading: "Semantic Selectors vs Classic Selectors",
        content: `<strong>Classic Selectors</strong> (legacy activities) use XML attribute matching — tag names, ids, class names, aaname. They break when the application's UI structure changes.<br/><br/>
<strong>Semantic Selectors</strong> (Modern Activities / Unified Target) use an AI-generated functional description of the element — for example, "the username field on the login screen." They match by <em>intent</em>, not structure, making automations resilient to UI refactors.<br/><br/>
<strong>Important defaults:</strong>
<ul>
  <li>Semantic Selectors are <strong>disabled by default</strong></li>
  <li>They activate only as a fallback <strong>after Computer Vision fails</strong></li>
  <li>They can be promoted to primary method by disabling higher-priority methods</li>
</ul>
<strong>Unified Target fallback order (highest to lowest priority):</strong>`,
        code: `// Unified Target targeting method priority:

1. Strict Selector   <- exact XML attribute match (fastest, most brittle)
2. Fuzzy Selector    <- partial attribute match (tolerates minor changes)
3. Computer Vision   <- AI image-based detection
4. Semantic          <- AI functional description (disabled by default, last resort)
5. Image             <- pixel-level screenshot match
6. Native Text       <- text content targeting`
      },
      {
        heading: "Core Semantic Activities Reference",
        content: `<strong>Extract Form Data</strong> — Extracts structured data from complex forms using AI to understand field labels and values.<br/><br/>
<strong>Fill Form</strong> — Populates an entire form from a data source; AI determines which field maps to which value based on semantic understanding of field labels.<br/><br/>
<strong>Set Value</strong> — Sets the value of a single semantically-identified field.<br/><br/>
<strong>Close Popup</strong> — Closes popup dialogs. In standard mode it uses a rule-based approach (no AI units). Enabling <strong>AI-Enhanced mode</strong> uses AI to identify the correct dismiss action on complex or unusual popups.<br/><br/>
<strong>When to use Semantic vs Traditional:</strong>
<ul>
  <li>Use Semantic when selectors are <strong>unstable</strong> due to frequent UI changes</li>
  <li>Use Semantic for <strong>dynamic forms</strong> where field structure is unpredictable</li>
  <li>Prefer traditional selectors when <strong>performance and AI unit cost</strong> are a concern</li>
</ul>`
      }
    ],
    quiz: [
      {
        q: "Which Semantic Activity does NOT consume AI units by default?",
        options: [
          "Extract Form Data",
          "Fill Form",
          "Set Value",
          "Close Popup"
        ],
        answer: 3,
        trap: "Close Popup is the trap. It sounds equally 'AI-powered' as the others, but in standard mode it uses a rule-based popup heuristic with zero AI unit cost. It only consumes one AI unit when AI-Enhanced mode is explicitly toggled on. The other three always consume one AI unit per request.",
        explanation: "Extract Form Data, Fill Form, and Set Value each consume one AI unit every time they run. Close Popup is the exception — AI unit consumption is gated behind the AI-Enhanced mode toggle, which is off by default."
      },
      {
        q: "Where does the Semantic Selector sit in the Unified Target fallback chain?",
        options: [
          "It runs first as the primary targeting method",
          "It is disabled by default and activates only after Computer Vision fails",
          "It is only available in Classic Activities, not Modern",
          "It replaces the Fuzzy Selector entirely"
        ],
        answer: 1,
        trap: "Option A is the main trap — 'Semantic' sounds authoritative and intelligent, so it feels like it should run first. But Semantic Selectors are actually disabled by default and sit near the bottom of the priority order, only activating as a last resort after Computer Vision has already failed.",
        explanation: "Unified Target priority: Strict → Fuzzy → Computer Vision → Semantic → Image → Native Text. Semantic can be promoted to primary by disabling methods above it, but out of the box it is the lowest-priority active fallback."
      },
      {
        q: "What is the key distinction between Classic Selectors and Semantic Selectors?",
        options: [
          "Classic selectors use AI descriptions; Semantic selectors use XML attributes",
          "Classic selectors match by XML attributes; Semantic selectors match by AI functional description",
          "Semantic selectors execute faster than Classic selectors",
          "Semantic selectors require no design-time configuration"
        ],
        answer: 1,
        trap: "Option C ('Semantic is faster') is a plausible-sounding trap — AI feels modern and quick — but Semantic selectors are actually slower: they only run after multiple other methods have failed. Option D is also wrong; Semantic selectors require a stored functional description captured at design time.",
        explanation: "Classic selectors match rigid XML attributes (aaname, class, id) which break when UI structure changes. Semantic selectors match by functional meaning — e.g., 'the Submit button on the checkout form' — making them resilient to UI refactors even when element attributes change entirely."
      }
    ]
  },
  {
    id: "strings",
    icon: "🔤",
    title: "String & List Operations",
    subtitle: ".Join · .Concat · Substring · ElementAt",
    color: "#34D399",
    sections: [
      {
        heading: "String.Join — Combining a List into a String",
        content: `<strong>String.Join</strong> takes a separator and a collection, and merges every element into a single string.<br/><br/>
<strong>Signature:</strong> String.Join(separator As String, values As IEnumerable)<br/><br/>
The separator appears BETWEEN elements only — never before the first or after the last.`,
        code: `myList = {"Apple", "Banana", "Cherry"}  ' List(Of String)

// Joining with comma:
result = String.Join(", ", myList)
' result = "Apple, Banana, Cherry"

// Joining with newline:
result = String.Join(Environment.NewLine, myList)

// Joining with no separator:
result = String.Join("", myList)
' result = "AppleBananaCherry"`
      },
      {
        heading: "Concat, Substring, and ElementAt",
        content: `<strong>String.Concat / & operator</strong> — joins strings with no separator. VB.Net uses the & operator.<br/><br/>
<strong>.Substring(startIndex, length)</strong> — extracts part of a string. Always <strong>zero-based indexing</strong>.<br/><br/>
<strong>.ElementAt(index)</strong> — retrieves item from any IEnumerable by zero-based index.`,
        code: `// Concatenation (VB.Net preferred):
result = firstName & " " & lastName

// Substring - "Hello World" (H=0, e=1, l=2...)
myString.Substring(6)       ' "World" (index 6 to end)
myString.Substring(0, 5)    ' "Hello" (5 chars from 0)
myString.Substring(myString.Length - 5)  ' last 5 chars

// List operations:
fruits = {"Apple","Banana","Cherry"}
fruits(1)              ' "Banana" - direct indexer
fruits.ElementAt(1)    ' "Banana" - LINQ method
fruits.First()         ' "Apple"
fruits.Last()          ' "Cherry"
fruits.Count           ' 3`
      }
    ],
    quiz: [
      {
        q: "What does String.Join(\"-\", {\"A\",\"B\",\"C\"}) return?",
        options: [
          "\"A-B-C-\"",
          "\"-A-B-C\"",
          "\"A-B-C\"",
          "\"ABC\""
        ],
        answer: 2,
        trap: "Options A and B test whether you think the separator appears at the start or end. String.Join places the separator BETWEEN elements only — never before the first or after the last element.",
        explanation: "String.Join places the separator strictly between elements. Result is A-B-C with no leading or trailing separator character."
      },
      {
        q: "Given myString = \"UiPath Studio\", what does myString.Substring(7) return?",
        options: [
          "\"UiPath \"",
          "\"Studio\"",
          "\"tudio\"",
          "An error — Substring requires two arguments"
        ],
        answer: 1,
        trap: "Option D is a trap — Substring has two valid overloads: Substring(startIndex) and Substring(startIndex, length). Option C (tudio) would be index 8. Count: U=0, i=1, P=2, a=3, t=4, h=5, space=6, S=7.",
        explanation: "Index 7 is the S in Studio. Substring(7) returns from that position to the end of the string, giving Studio."
      },
      {
        q: "What is the correct VB.Net expression to get the LAST 4 characters of a string variable named code?",
        options: [
          "code.Substring(code.Length - 4)",
          "code.Substring(-4)",
          "code.Last(4)",
          "code.Substring(4)"
        ],
        answer: 0,
        trap: "Option B is a Python-style trap — negative indexing does NOT work in .NET or VB.Net. Option C is fictional. Option D takes 4 characters from the START, not the end of the string.",
        explanation: "To get the last N characters: Substring(Length - N). For last 4: code.Substring(code.Length - 4). This is the standard .NET pattern."
      },
      {
        q: "myList.ElementAt(0) vs myList(0) — which statement is TRUE?",
        options: [
          "They return different results — ElementAt is 1-based, () indexer is 0-based",
          "Both return the first element; ElementAt is a LINQ extension method that works on any IEnumerable",
          "myList(0) only works on arrays, not on List(Of String)",
          "ElementAt throws an error if the list has fewer than 2 items"
        ],
        answer: 1,
        trap: "Option A is a critical trap — ElementAt is 0-based, exactly like the direct indexer. There is no 1-based default indexing in .NET collections. Option C is false — List(Of T) fully supports the () indexer.",
        explanation: "Both return the element at index 0 (the first item). ElementAt is a LINQ method that works on any IEnumerable, while () is the direct List indexer. For a List they are functionally identical."
      }
    ]
  },
  {
    id: "gettext",
    icon: "📋",
    title: "Get Text & FindText",
    subtitle: "Scraping UI Content",
    color: "#FB923C",
    sections: [
      {
        heading: "Get Text Activity",
        content: `<strong>Get Text</strong> extracts the visible text content from a UI element (label, textbox, span, etc.).<br/><br/>
<ul>
  <li>Package: UiPath.UIAutomation.Activities</li>
  <li>Output property: Text (String variable)</li>
  <li>Must be inside an Application/Browser scope or active window context</li>
  <li>WaitForReady — set to INTERACTIVE to wait before scraping</li>
  <li>Timeout — how long to wait for element (default 30 seconds)</li>
</ul>`,
        code: `// Typical usage flow:
1. Attach Use Application/Browser to your window
2. Drag Get Text inside it
3. Click Indicate on screen to set selector
4. Create output variable: extractedText (String)
5. Set Text = extractedText

// Then use the variable:
Log Message: extractedText
If extractedText.Contains("Success") Then ...`
      },
      {
        heading: "UiPath.Core.Activities.FindText",
        content: `<strong>FindText</strong> searches for a specific text string within a UI element and returns a <strong>UiElement</strong> reference.<br/><br/>
<ul>
  <li>Namespace: UiPath.Core.Activities (Classic Activities package)</li>
  <li>Output: FoundElement — a UiElement you can click, hover, or use as an anchor</li>
  <li>Use case: Dynamic text whose position changes — find a label to anchor to adjacent value</li>
  <li>Properties: Text, SearchTarget, FoundElement, Occurrence, RegularExpression</li>
</ul>`,
        code: `// FindText + anchoring pattern:
FindText
  Text = "Invoice Total:"
  FoundElement -> labelElement (UiElement)

// Use labelElement as anchor
// to find the dynamically positioned adjacent value

// Classic selector anchoring:
<webctrl aaname='Invoice Total:' />
<webctrl idx='1' />    <- sibling element next to found text`
      }
    ],
    quiz: [
      {
        q: "What is the output variable type of the Get Text activity?",
        options: [
          "UiElement",
          "Object",
          "String",
          "GenericValue"
        ],
        answer: 2,
        trap: "Option A (UiElement) is the output of FindText, not Get Text — a very common exam mix-up. Option D (GenericValue) is what some Data Scraping scenarios return but not Get Text.",
        explanation: "Get Text outputs a String. FindText outputs a UiElement. Knowing which activity returns which type is a frequent certification question."
      },
      {
        q: "FindText (UiPath.Core.Activities.FindText) belongs to which package type?",
        options: [
          "UiPath.UIAutomation.Activities (Modern experience)",
          "UiPath.Core.Activities (Classic experience)",
          "UiPath.System.Activities",
          "UiPath.Web.Activities"
        ],
        answer: 1,
        trap: "Option A is the trap — FindText is a CLASSIC activities package activity. This matters because if your project has modernBehavior enabled (which was the fix for the Write Range issue you encountered), classic activities may be restricted.",
        explanation: "FindText lives in UiPath.Core.Activities — the classic package. Modern projects may need to enable classic activities or use alternative approaches."
      },
      {
        q: "WaitForReady is set to INTERACTIVE on a Get Text activity. What does this mean?",
        options: [
          "The activity pauses and waits for the user to click a confirmation",
          "UiPath waits until the application signals it is ready to receive user input before scraping",
          "The activity automatically retries until text is found",
          "It enables the activity to work with interactive PDF forms"
        ],
        answer: 1,
        trap: "Option A implies human intervention — completely wrong. Option C describes retry behavior which is a separate Retry property. INTERACTIVE is an application readiness signal, not user interaction.",
        explanation: "INTERACTIVE waits until the target application's UI thread is idle and ready for input. This prevents scraping while the app is still loading or rendering its content."
      }
    ]
  },
  {
    id: "testcases",
    icon: "✅",
    title: "Test Cases",
    subtitle: "UiPath Test Suite & Studio Testing",
    color: "#FBBF24",
    sections: [
      {
        heading: "What Are Test Cases in UiPath?",
        content: `UiPath has a built-in <strong>Test Suite</strong> framework. Test Cases are special .xaml files designed to validate automation behavior.<br/><br/>
<strong>Key Testing Activities:</strong>
<ul>
  <li><strong>Verify Expression</strong> — asserts a Boolean expression is True</li>
  <li><strong>Verify Expression with Operator</strong> — asserts two values satisfy a comparison</li>
  <li><strong>Verify Control Attribute</strong> — asserts a UI property equals expected value</li>
  <li><strong>Mock Application</strong> — replaces external dependencies for isolated testing</li>
</ul>`,
        code: `// Test Case structure:
// Given: Set up preconditions
  -> Type Into: username = "testuser"
  -> Type Into: password = "pass123"

// When: Execute the action
  -> Click: Login button

// Then: Assert the outcome
  Verify Expression: pageTitle = "Dashboard"
  Verify Control Attribute:
    Target = welcomeLabel
    Attribute = "text"
    Expression = "Welcome, testuser!"`
      },
      {
        heading: "Test Case Scoping & Data Driven Testing",
        content: `<strong>Scope Rules:</strong>
<ul>
  <li>Test Cases run independently — each has its own execution context</li>
  <li>Shared setup/teardown: Test Case Setup and Test Case Teardown hooks</li>
  <li>Variables scoped to the test case .xaml only by default</li>
  <li>Use Arguments for data passed in via Test Data sources</li>
</ul>
<strong>Data Driven Test Cases:</strong> Attach an Excel/CSV file — Studio auto-runs the same Test Case once per row with that row's values as arguments.`,
        code: `// Data-driven test case arguments:
In: username (String)
In: password (String)
In: expectedResult (String)

// Bind to Excel:
TestDataFile = "TestData.xlsx"
// Studio auto-iterates: 10 rows = 10 separate test runs`
      }
    ],
    quiz: [
      {
        q: "Which activity is the PRIMARY assertion tool in a UiPath Test Case?",
        options: [
          "If Activity with a Log Message in the Else branch",
          "Verify Expression",
          "Assert Variable",
          "Throw Activity with a custom exception"
        ],
        answer: 1,
        trap: "Option A is a DIY workaround that does NOT integrate with Test Suite reporting. Option C (Assert Variable) does not exist as a named UiPath activity. Option D is error handling, not assertion — it would crash the workflow, not report a test failure.",
        explanation: "Verify Expression is the built-in assertion activity. It marks the test as FAILED in Test Suite reporting if the expression is False, which is the correct behavior."
      },
      {
        q: "In a Data Driven Test Case bound to a 5-row Excel file, how many test executions occur?",
        options: [
          "1 — the rows are steps within a single test run",
          "5 — each row is a separate independent test execution",
          "It depends on the Verify Expression results",
          "5 rows are processed in a loop within a single test run"
        ],
        answer: 1,
        trap: "Options A and D are the key traps. Rows are NOT sequential steps or loop iterations. Each row triggers a completely independent execution of the entire Test Case — like running the test 5 separate times with different inputs.",
        explanation: "Each Excel row produces one full, independent test run. A 5-row file = 5 separate test results in Test Suite reporting, each with its own pass/fail status."
      },
      {
        q: "When do Test Case Setup and Teardown hooks execute?",
        options: [
          "Setup runs once before the entire test suite; Teardown runs once after all tests complete",
          "Setup runs before each individual test case; Teardown runs after each individual test case",
          "Setup imports test data; Teardown exports test results to a report",
          "They only run when triggered manually from the Test Suite panel"
        ],
        answer: 1,
        trap: "Option A is the critical trap — Setup and Teardown run PER test case execution, not once for the whole suite. This distinction matters especially in data-driven tests where they run before/after EACH row's execution.",
        explanation: "Setup runs before each individual test case (e.g., open browser, navigate to app). Teardown runs after each test (e.g., close browser, clean test data). Both run per-execution."
      }
    ]
  },
  {
    id: "svn",
    icon: "🗂",
    title: "SVN Commit",
    subtitle: "Source Control in UiPath Studio",
    color: "#F472B6",
    sections: [
      {
        heading: "SVN Integration in UiPath Studio",
        content: `UiPath Studio integrates with <strong>Apache Subversion (SVN)</strong> for team source control.<br/><br/>
<strong>Core SVN Operations:</strong>
<ul>
  <li><strong>Commit</strong> — send your local changes to the remote SVN server</li>
  <li><strong>Update</strong> — pull latest changes from server to local</li>
  <li><strong>Revert</strong> — discard local changes, restore last server version</li>
  <li><strong>Show History</strong> — view all committed versions of a file</li>
  <li><strong>Show Changes</strong> — diff local vs server version before committing</li>
</ul>`,
        code: `// Correct SVN workflow per session:
1. Team tab -> Update        <- ALWAYS first
2. Make changes to .xaml files
3. Team tab -> Show Changes  <- review diff
4. Team tab -> Commit
5. Enter message: "Fix: Added error handling to Login — JIRA-101"
6. Select files -> OK

// Commit message format:
"[Type]: [Description] — [Ticket ID]"
Fix / Feat / Refactor / Docs`
      },
      {
        heading: "SVN Conflict Resolution",
        content: `<strong>Conflicts occur</strong> when two developers edit the same file between commits.<br/><br/>
<strong>Resolution Steps:</strong>
<ol>
  <li>Conflicted files show a warning icon in the Project panel</li>
  <li>Right-click the file -> Edit Conflicts</li>
  <li>Choose: Accept Mine, Accept Theirs, or manual merge</li>
  <li>After resolving, commit the merged file</li>
</ol>
<strong>Prevention:</strong> Update before starting work. Commit frequently in small chunks. Use separate .xaml files per developer when possible.`,
        code: `// Conflict prevention checklist:
-> Update at start of every session
-> Commit at end of every session
-> Use separate workflow files per developer
-> Never commit broken/untested workflows
-> Use descriptive commit messages always`
      }
    ],
    quiz: [
      {
        q: "What is the correct order of operations at the START of a work session using SVN?",
        options: [
          "Make changes -> Commit -> Update",
          "Commit any pending local work -> Update -> Make new changes -> Commit",
          "Update -> Make changes -> Commit",
          "Make changes -> Update -> Resolve conflicts -> Commit"
        ],
        answer: 2,
        trap: "Option D is dangerous — updating AFTER making local changes creates conflicts that are harder to resolve because you are merging with a dirty working copy. Always Update FIRST on a clean working copy.",
        explanation: "Update -> Work -> Commit is the correct SVN workflow. Updating first ensures you start from the latest server state, minimizing merge conflicts."
      },
      {
        q: "What does SVN Revert do to your local files?",
        options: [
          "Pushes your changes to the server and tags them as a revert commit",
          "Discards ALL local uncommitted changes and restores the last committed server version",
          "Undoes only the last single change made to the file",
          "Creates a backup of local changes before restoring the server version"
        ],
        answer: 1,
        trap: "Option A describes a Git revert commit — SVN Revert is purely a LOCAL operation and does not touch the server at all. Option C is wrong — Revert discards ALL uncommitted changes, not just the last one. Option D is false — no backup is created.",
        explanation: "SVN Revert permanently discards all local uncommitted changes and restores the file exactly as it exists on the server. This is irreversible — use with caution."
      },
      {
        q: "Developer A and Developer B both edit the same .xaml file. A commits first. What happens when B tries to commit?",
        options: [
          "B's commit succeeds and silently overwrites A's changes",
          "SVN rejects B's commit — B must Update first, resolve any conflicts, then commit",
          "SVN automatically merges the .xaml files and commits both sets of changes",
          "B's commit is queued and applied automatically after a delay"
        ],
        answer: 1,
        trap: "Option A would cause data loss — SVN detects this and prevents it. Option C is wishful thinking — .xaml files are XML and frequently conflict in ways SVN cannot auto-resolve. Option D does not exist in SVN.",
        explanation: "SVN detects that B's local copy is out of date and rejects the commit. B must Update (which flags the conflict), resolve it manually in the merge tool, then commit the resolved version."
      }
    ]
  },
  {
    id: "debugging",
    icon: "🐛",
    title: "Debugging in UiPath",
    subtitle: "Breakpoints · Execution Controls · Debug Panels",
    color: "#60A5FA",
    sections: [
      {
        heading: "Breakpoint Types",
        content: `<strong>Simple (F9)</strong> — Pauses every time execution reaches that activity. Toggle with F9 or right-click.<br/><br/>
<strong>Conditional</strong> — Only pauses when a Boolean expression evaluates to True. Right-click the activity -> Breakpoint -> Add Condition.<br/><br/>
<strong>Hit Count</strong> — Pauses after the activity has been executed N times. Perfect for loops. Configure in Breakpoints panel.<br/><br/>
<strong>Log Message Breakpoint</strong> — Logs a value to the Output panel WITHOUT pausing execution. Non-invasive tracing during a full run.`,
        code: `// Conditional breakpoint expressions (VB.Net):
counter > 50
myString = "ERROR"
Not invoiceTotal > 0
currentRow.Item("Status").ToString = "Failed"

// Hit Count — pause on the 10th execution:
Hit Count = 10

// Log Message breakpoint format:
"Loop: " & counter.ToString & " | Value: " & currentValue`
      },
      {
        heading: "Execution Controls",
        content: `<strong>Step Into (F11)</strong> — Executes one activity at a time and ENTERS sub-workflows to step through them.<br/><br/>
<strong>Step Over (F10)</strong> — Executes one activity at a time but runs sub-workflows FULLY without entering them.<br/><br/>
<strong>Step Out (Shift+F11)</strong> — Finishes executing the current sub-workflow entirely and returns to the caller.<br/><br/>
<strong>Slow Step</strong> — Runs at reduced speed with visual highlighting. Activities light up in sequence but execution does not pause.`,
        code: `// Execution control decision guide:
Trace inside a sub-workflow?      -> F11 Step Into
Trust sub-workflow, skip inside?  -> F10 Step Over
Done inside, return to parent?    -> Shift+F11 Step Out
Visual flow check, no pauses?     -> Slow Step
Resume to next breakpoint?        -> F5 Continue
Stop debugging entirely?          -> Shift+F5`
      },
      {
        heading: "Debug Panels",
        content: `<strong>Locals</strong> — Shows ALL variables in scope at the current breakpoint. Updates live as you step. Expand complex types (DataTable, List) to inspect inner values.<br/><br/>
<strong>Watch</strong> — You manually add specific expressions to monitor. Persists across breakpoints unlike Locals which is context-dependent.<br/><br/>
<strong>Call Stack</strong> — Shows the full hierarchy of executing workflows. Bottom = root, top = current. Click any frame to see its Locals.<br/><br/>
<strong>Immediate</strong> — Execute any VB.Net expression in real-time while paused. Can read AND write variable values mid-execution.`,
        code: `// Watch panel — useful expressions to pin:
myDataTable.Rows.Count
currentRow.Item("Status")
invoiceTotal > 1000
String.Join(", ", myList)

// Immediate panel examples:
? counter                    <- print current value
counter = 0                  <- SET value mid-debug
? myString.Substring(0,5)   <- test expression
? DateTime.Now.ToString()    <- run any .NET code

// Call Stack example:
Main.xaml                         <- root caller
  -> ProcessInvoices.xaml
    -> ValidateData.xaml          <- currently here`
      }
    ],
    quiz: [
      {
        q: "You are paused at a breakpoint INSIDE a sub-workflow called via Invoke Workflow. You want to finish the sub-workflow and return to the parent. Which key do you press?",
        options: [
          "F10 (Step Over)",
          "F11 (Step Into)",
          "Shift+F11 (Step Out)",
          "F5 (Continue/Resume)"
        ],
        answer: 2,
        trap: "Option A (Step Over) applies at the CALLER level before entering — once you are INSIDE a sub-workflow, F10 steps through it one activity at a time, not back to the parent. Option D resumes to the NEXT breakpoint which could be anywhere.",
        explanation: "Step Out (Shift+F11) finishes all remaining activities in the current sub-workflow and returns control to the parent workflow that invoked it. This is exactly what Step Out is designed for."
      },
      {
        q: "What is the key difference between the Locals panel and the Watch panel?",
        options: [
          "Locals shows only String variables; Watch shows all variable types",
          "Locals automatically shows all in-scope variables; Watch shows only expressions you manually add and are persistent",
          "Watch shows real-time values; Locals only updates when you press F5",
          "They show identical information — Watch is simply a filtered subset of Locals"
        ],
        answer: 1,
        trap: "Option A is false — Locals shows all types. Option C is wrong — both update at each step or breakpoint. Option D is false — Watch persists YOUR chosen expressions across different scopes while Locals changes entirely based on the current execution scope.",
        explanation: "Locals is automatic and scope-dependent (changes as you move through workflows). Watch is manual and persistent — your pinned expressions stay visible regardless of which workflow scope you are in."
      },
      {
        q: "A Conditional Breakpoint has the expression: counter > 5. A For Each loop runs 10 iterations (counter 1-10). How many times does execution pause?",
        options: [
          "10 times — every iteration triggers the breakpoint check",
          "1 time — only when counter first becomes greater than 5",
          "5 times — on iterations 6, 7, 8, 9, and 10",
          "0 times — conditional breakpoints only log messages, they do not pause"
        ],
        answer: 2,
        trap: "Option B is wrong — a Conditional breakpoint fires EVERY time the condition is True, not just the first time. Option D describes Log Message breakpoints, not Conditional breakpoints. Option A describes a Simple F9 breakpoint behavior.",
        explanation: "The breakpoint evaluates counter > 5 on every iteration. It is True for iterations 6, 7, 8, 9, and 10 — so execution pauses 5 times total."
      },
      {
        q: "The Immediate panel in Debug mode allows you to:",
        options: [
          "View all current variable values but not modify them",
          "Only evaluate read-only expressions that do not change workflow state",
          "Execute any VB.Net expression including reading AND writing variable values mid-execution",
          "Send log messages to UiPath Orchestrator in real time"
        ],
        answer: 2,
        trap: "Options A and B are the most common assumption traps — many developers think debug panels are read-only inspection tools. The Immediate panel can actually SET variable values during a paused execution, making it a powerful debugging tool.",
        explanation: "The Immediate panel is fully interactive. You can read values with ? myVar, evaluate any expression, and even assign new values (myVar = 0) while paused. This lets you test edge cases without restarting the run."
      },
      {
        q: "What exactly does a Hit Count breakpoint set to 5 do?",
        options: [
          "Pauses on every execution until 5 pauses have occurred (1st through 5th)",
          "Pauses ONLY on the 5th execution of that activity, then stops firing",
          "Pauses every 5th execution (5th, 10th, 15th, and so on)",
          "Counts 5 total breakpoint hits across ALL breakpoints in the workflow then pauses"
        ],
        answer: 1,
        trap: "Option A describes a Simple breakpoint limited to 5 hits — not how Hit Count works. Option C describes a modulo-style every-Nth behavior that does not exist by default. Option D is wrong — Hit Count is tracked per individual breakpoint, not globally.",
        explanation: "A Hit Count of 5 means: silently skip the first 4 executions, pause on exactly the 5th execution, then stop tracking. It fires once at the Nth hit — useful for catching bugs that only appear after several iterations."
      }
    ]
  },
  {
    id: "uiadav1-practice-exam",
    icon: "✓",
    title: "UI-ADAv1 Practice Exam",
    subtitle: "161 Interactive Certification Questions",
    color: "#F59E0B",
    quizLabel: "UI-ADAV1 PRACTICE EXAM",
    sections: [
      {
        heading: "About This Practice Exam",
        content: `This practice exam was imported from the supplied <strong>UI-ADAv1 question-and-answer PDF</strong>. It contains <strong>161 complete multiple-choice questions</strong>, with the source question number retained on every card.<br/><br/>
Use the <strong>Exam Questions</strong> tab to select an answer, check it immediately, and review the supplied explanation. When the source only provided an answer key, the feedback identifies the keyed answer without inventing an explanation.<br/><br/>
<strong>Import note:</strong> Source questions 2, 20, 82, 134, 147, and 155 depend on missing visual or drag-and-drop content and are not included in the interactive set. The source PDF also contains two different questions numbered 151; both are included.`
      }
    ],
    quiz: uiadav1Quiz
  }
];

function ExamTimerPanel({ timer, color, totalQuestions, onReset, compact = false }) {
  const currentTime = timer.currentQuestion === null
    ? 0
    : timer.inProgressTimes[timer.currentQuestion] ?? 0;

  return (
    <div style={{
      margin: compact ? "0 0 16px" : "12px",
      padding: "12px",
      background: `linear-gradient(135deg, ${color}12, var(--bg-section-header))`,
      border: `1px solid ${color}45`,
      borderRadius: 9,
    }}>
      <div style={{ fontSize: 9, color, letterSpacing: 1.5, fontWeight: 800, marginBottom: 10 }}>
        EXAM TIMER
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <div>
          <div style={{ fontSize: 8, color: "var(--text-faint)", letterSpacing: 1 }}>TOTAL TIME</div>
          <div style={{ fontSize: 17, color: "var(--text-primary)", fontWeight: 800, marginTop: 3 }}>
            {formatDuration(timer.totalSeconds, true)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 8, color: "var(--text-faint)", letterSpacing: 1 }}>
            {timer.currentQuestion === null ? "STATUS" : `QUESTION ${timer.currentQuestion + 1}`}
          </div>
          <div style={{ fontSize: 17, color: timer.currentQuestion === null ? "#34D399" : color, fontWeight: 800, marginTop: 3 }}>
            {timer.currentQuestion === null ? "DONE" : formatDuration(currentTime)}
          </div>
        </div>
      </div>
      <div style={{ fontSize: 9, color: "var(--text-muted)", marginTop: 10 }}>
        {timer.answeredCount} of {totalQuestions} answered
      </div>
      <div style={{ height: 4, background: "var(--border-primary)", borderRadius: 2, marginTop: 6, overflow: "hidden" }}>
        <div style={{
          width: `${(timer.answeredCount / totalQuestions) * 100}%`,
          height: "100%",
          background: color,
          transition: "width 0.2s ease",
        }} />
      </div>
      <button
        type="button"
        onClick={onReset}
        disabled={!timer.started}
        style={{
          width: "100%",
          marginTop: 10,
          padding: "6px 8px",
          background: "transparent",
          border: "1px solid var(--border-primary)",
          borderRadius: 6,
          color: timer.started ? "var(--text-secondary)" : "var(--text-faint)",
          cursor: timer.started ? "pointer" : "not-allowed",
          fontFamily: "inherit",
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: 0.5,
        }}
      >
        RESET TEST & TIMER
      </button>
    </div>
  );
}

const QuizSection = memo(function QuizSection({
  questions,
  color,
  label = "CERTIFICATION TRAP QUESTIONS",
  questionTimes,
  onQuestionFocus,
  onQuestionSubmit,
}) {
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState({});

  const handleSelect = (qi, oi) => {
    if (submitted[qi]) return;
    onQuestionFocus?.(qi);
    setAnswers(prev => ({ ...prev, [qi]: oi }));
  };

  const handleSubmit = (qi) => {
    if (answers[qi] === undefined) return;
    const nextSubmitted = { ...submitted, [qi]: true };
    const nextQuestion = questions.findIndex((_, index) => !nextSubmitted[index]);
    setSubmitted(nextSubmitted);
    onQuestionSubmit?.(qi, nextQuestion);
  };

  const totalSubmitted = Object.keys(submitted).length;
  const totalCorrect = Object.keys(submitted).filter(qi => answers[qi] === questions[qi].answer).length;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ fontSize: 11, color, letterSpacing: 2, fontWeight: 700 }}>
          {label}
        </div>
        {totalSubmitted > 0 && (
          <div style={{
            fontSize: 11, fontWeight: 700,
            color: totalCorrect === totalSubmitted ? "#34D399" : totalCorrect >= totalSubmitted / 2 ? "#FBBF24" : "#F87171",
            background: "var(--bg-root)",
            border: `1px solid ${color}30`,
            borderRadius: 20,
            padding: "3px 12px"
          }}>
            {totalCorrect} / {totalSubmitted} correct
          </div>
        )}
      </div>

      {questions.map((q, qi) => {
        const isSubmitted = !!submitted[qi];
        const selected = answers[qi];
        const isCorrect = selected === q.answer;

        return (
          <div key={qi} style={{
            marginBottom: 16,
            border: `1px solid ${isSubmitted ? (isCorrect ? "#34D39940" : "#F8717140") : "var(--border-primary)"}`,
            borderRadius: 10,
            overflow: "hidden",
            background: "var(--bg-root)"
          }}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border-primary)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 5 }}>
                <span style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: 1 }}>
                  {q.sourceNumber ? `SOURCE QUESTION ${q.sourceNumber} · ` : ""}QUESTION {qi + 1} OF {questions.length}
                </span>
                {isSubmitted && questionTimes?.[qi] !== undefined && (
                  <span style={{ fontSize: 10, color, letterSpacing: 1, whiteSpace: "nowrap" }}>
                    TIME {formatDuration(questionTimes[qi])}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 13, color: "var(--text-primary)", lineHeight: 1.6, fontWeight: 600 }}>
                {q.q}
              </div>
            </div>

            <div style={{ padding: "12px 14px" }}>
              {q.options.map((opt, oi) => {
                let bg = "var(--bg-option)";
                let borderColor = "var(--border-primary)";
                let textColor = "var(--text-secondary)";

                if (isSubmitted) {
                  if (oi === q.answer) {
                    bg = "#052e16"; borderColor = "#34D399"; textColor = "#86EFAC";
                  } else if (oi === selected && !isCorrect) {
                    bg = "#2d0a0a"; borderColor = "#F87171"; textColor = "#FCA5A5";
                  }
                } else if (selected === oi) {
                  bg = `${color}15`; borderColor = color; textColor = "#fff";
                }

                const circleColor = isSubmitted && oi === q.answer ? "#34D399"
                  : isSubmitted && oi === selected && !isCorrect ? "#F87171"
                  : selected === oi && !isSubmitted ? color
                  : "transparent";
                const circleText = isSubmitted && (oi === q.answer || (oi === selected && !isCorrect)) ? "#000"
                  : selected === oi && !isSubmitted ? "#000"
                  : textColor;

                return (
                  <button
                    type="button"
                    key={oi}
                    onClick={() => handleSelect(qi, oi)}
                    disabled={isSubmitted}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      marginBottom: 6,
                      border: `1px solid ${borderColor}`,
                      borderRadius: 7,
                      cursor: isSubmitted ? "default" : "pointer",
                      background: bg,
                      color: textColor,
                      fontFamily: "inherit",
                      fontSize: 16,
                      textAlign: "left",
                      lineHeight: 1.5,
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 10,
                      transition: "all 0.15s"
                    }}
                  >
                    <span style={{
                      minWidth: 20, height: 20,
                      border: `1px solid ${borderColor}`,
                      borderRadius: "50%",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 10, fontWeight: 700, flexShrink: 0,
                      background: circleColor,
                      color: circleText
                    }}>
                      {String.fromCharCode(65 + oi)}
                    </span>
                    {opt}
                  </button>
                );
              })}

              {!isSubmitted && (
                <button
                  onClick={() => handleSubmit(qi)}
                  disabled={selected === undefined}
                  style={{
                    marginTop: 8,
                    padding: "8px 22px",
                    background: selected !== undefined ? color : "var(--border-primary)",
                    border: "none",
                    borderRadius: 6,
                    color: selected !== undefined ? "#000" : "var(--text-muted)",
                    fontSize: 16,
                    fontWeight: 700,
                    cursor: selected !== undefined ? "pointer" : "not-allowed",
                    transition: "all 0.2s"
                  }}
                >
                  Check Answer
                </button>
              )}

              {isSubmitted && (
                <div style={{
                  marginTop: 10,
                  padding: "12px 14px",
                  background: isCorrect ? "#052e1660" : "#2d0a0a60",
                  border: `1px solid ${isCorrect ? "#34D39930" : "#F8717130"}`,
                  borderRadius: 8
                }}>
                  <div style={{
                    fontSize: 11, fontWeight: 800, letterSpacing: 1,
                    color: isCorrect ? "#34D399" : "#F87171",
                    marginBottom: 8
                  }}>
                    {isCorrect ? "✓ CORRECT" : "✗ INCORRECT — Correct answer: " + String.fromCharCode(65 + q.answer)}
                  </div>
                  {q.trap && (
                    <div style={{ fontSize: 11, color: "#FBBF24", marginBottom: 8, lineHeight: 1.7 }}>
                      <strong style={{ color: "#FCD34D" }}>TRAP: </strong>{q.trap}
                    </div>
                  )}
                  {q.explanation && (
                    <div style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.7 }}>
                      <strong style={{ color: "var(--text-primary)" }}>Why: </strong>{q.explanation}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
});

export default function UiPathCourse() {
  const rootRef = useRef(null);
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem("uipath-theme");
    if (saved) return saved === "dark";
    return !window.matchMedia("(prefers-color-scheme: light)").matches;
  });

  const toggleTheme = () => setIsDark(prev => !prev);

  useEffect(() => {
    if (rootRef.current) {
      isDark
        ? rootRef.current.removeAttribute("data-theme")
        : rootRef.current.setAttribute("data-theme", "light");
    }
    localStorage.setItem("uipath-theme", isDark ? "dark" : "light");
  }, [isDark]);

  const [active, setActive] = useState("else-if");
  const [openSections, setOpenSections] = useState({});
  const [activeTab, setActiveTab] = useState("content");
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [examTimer, setExamTimer] = useState(() => createExamTimer());

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!examTimer.running) return undefined;

    const intervalId = window.setInterval(() => {
      setExamTimer(prev => {
        if (!prev.running || prev.currentQuestion === null) return prev;
        return {
          ...prev,
          totalSeconds: prev.totalSeconds + 1,
          inProgressTimes: {
            ...prev.inProgressTimes,
            [prev.currentQuestion]: (prev.inProgressTimes[prev.currentQuestion] ?? 0) + 1,
          },
        };
      });
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [examTimer.running]);

  const topic = topics.find(t => t.id === active);

  const resetExamTimer = useCallback(() => {
    const restartImmediately = active === TIMED_EXAM_ID && activeTab === "quiz";
    setExamTimer(prev => ({
      ...createExamTimer(prev.resetKey + 1),
      started: restartImmediately,
      running: restartImmediately,
      inProgressTimes: restartImmediately ? { 0: 0 } : {},
    }));
  }, [active, activeTab]);

  const startExamTimer = useCallback(() => {
    setExamTimer(prev => prev.started ? prev : {
      ...prev,
      started: true,
      running: true,
      currentQuestion: 0,
      inProgressTimes: { 0: 0 },
    });
  }, []);

  const focusTimedQuestion = useCallback((questionIndex) => {
    setExamTimer(prev => {
      if (!prev.started || Object.hasOwn(prev.completedTimes, questionIndex)) return prev;
      return {
        ...prev,
        currentQuestion: questionIndex,
        inProgressTimes: {
          ...prev.inProgressTimes,
          [questionIndex]: prev.inProgressTimes[questionIndex] ?? 0,
        },
      };
    });
  }, []);

  const submitTimedQuestion = useCallback((questionIndex, nextQuestion) => {
    setExamTimer(prev => {
      if (!prev.started || Object.hasOwn(prev.completedTimes, questionIndex)) return prev;
      const completedTimes = {
        ...prev.completedTimes,
        [questionIndex]: prev.inProgressTimes[questionIndex] ?? 0,
      };
      const answeredCount = Object.keys(completedTimes).length;
      const isComplete = answeredCount === uiadav1Quiz.length;

      return {
        ...prev,
        completedTimes,
        answeredCount,
        currentQuestion: isComplete ? null : nextQuestion,
        running: !isComplete,
        inProgressTimes: nextQuestion < 0 ? prev.inProgressTimes : {
          ...prev.inProgressTimes,
          [nextQuestion]: prev.inProgressTimes[nextQuestion] ?? 0,
        },
      };
    });
  }, []);

  const handleTopicChange = (id) => {
    if (active === TIMED_EXAM_ID && id !== TIMED_EXAM_ID) {
      setExamTimer(prev => createExamTimer(prev.resetKey + 1));
    }
    setActive(id);
    setOpenSections({});
    setActiveTab("content");
    if (isMobile) setSidebarOpen(false);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (active === TIMED_EXAM_ID && tab === "quiz") startExamTimer();
  };

  const toggleSection = (key) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div ref={rootRef} style={{
      minHeight: "100vh",
      background: "var(--bg-root)",
      fontFamily: "'Courier New', Consolas, monospace",
      color: "var(--text-primary)",
      display: "flex",
      flexDirection: "column"
    }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, var(--bg-section-header), var(--border-primary))",
        borderBottom: "1px solid var(--border-header)",
        padding: isMobile ? "10px 14px" : "14px 24px",
        display: "flex",
        alignItems: "center",
        gap: 14,
        flexShrink: 0
      }}>
        <div style={{
          width: 38, height: 38,
          background: "linear-gradient(135deg, #00C6FF, #0072FF)",
          borderRadius: 9,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 18, fontWeight: 900, color: "#fff",
          boxShadow: "0 0 18px rgba(0,198,255,0.35)"
        }}>U</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", letterSpacing: 0.5 }}>
            UiPath Studio — Certification Course
          </div>
          <div style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: 2, textTransform: "uppercase" }}>
            Deep Dive + Exam Trap Questions
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          <span style={{ fontSize: 14 }}>🌙</span>
          <div
            onClick={toggleTheme}
            role="switch"
            aria-checked={!isDark}
            aria-label="Toggle light mode"
            style={{
              width: 40, height: 22,
              background: isDark ? "#1E293B" : "#0072FF",
              border: `1px solid ${isDark ? "#334155" : "#0060D0"}`,
              borderRadius: 11,
              position: "relative",
              cursor: "pointer",
              flexShrink: 0
            }}
          >
            <div style={{
              width: 16, height: 16,
              background: isDark ? "#60A5FA" : "#FFFFFF",
              borderRadius: "50%",
              position: "absolute",
              top: 2,
              left: isDark ? 2 : 22,
              transition: "left 0.2s ease, background-color 0.2s ease"
            }} />
          </div>
          <span style={{ fontSize: 14 }}>☀️</span>
        </div>
        {isMobile && (
          <button
            onClick={() => setSidebarOpen(p => !p)}
            aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
            aria-expanded={sidebarOpen}
            style={{
              background: "none",
              border: "1px solid var(--text-faint)",
              borderRadius: 6,
              color: "var(--text-secondary)",
              cursor: "pointer",
              fontSize: 18,
              padding: "4px 8px",
              lineHeight: 1,
              flexShrink: 0,
            }}
          >
            {sidebarOpen ? "✕" : "☰"}
          </button>
        )}
      </div>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Sidebar */}
        <div style={{
          width: sidebarOpen ? 200 : 0,
          background: "var(--bg-sidebar)",
          overflowY: sidebarOpen ? "auto" : "hidden",
          overflowX: "hidden",
          flexShrink: 0,
          transition: "width 0.25s ease",
        }}>
          <div style={{ width: 200 }}>
            {topics.map(t => (
              <button
                key={t.id}
                onClick={() => handleTopicChange(t.id)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "11px 13px",
                  background: active === t.id ? `linear-gradient(90deg, ${t.color}15, transparent)` : "transparent",
                  border: "none",
                  borderLeft: active === t.id ? `3px solid ${t.color}` : "3px solid transparent",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 9
                }}
              >
                <span style={{ fontSize: 15 }}>{t.icon}</span>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: active === t.id ? t.color : "var(--text-secondary)", lineHeight: 1.3 }}>
                    {t.title}
                  </div>
                  <div style={{ fontSize: 9, color: "var(--text-faint)", marginTop: 1 }}>
                    {t.quiz.length} questions
                  </div>
                </div>
              </button>
            ))}
            {active === TIMED_EXAM_ID && (
              <ExamTimerPanel
                timer={examTimer}
                color={topic.color}
                totalQuestions={topic.quiz.length}
                onReset={resetExamTimer}
              />
            )}
          </div>
        </div>

        {/* Desktop chevron toggle */}
        {!isMobile && (
          <button
            onClick={() => setSidebarOpen(p => !p)}
            aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            aria-expanded={sidebarOpen}
            style={{
              width: 18,
              background: "var(--bg-sidebar)",
              border: "none",
              borderRight: "1px solid var(--border-primary)",
              cursor: "pointer",
              color: "var(--text-secondary)",
              fontSize: 14,
              flexShrink: 0,
              padding: "8px 0 0 0",
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "center",
            }}
          >
            {sidebarOpen ? "‹" : "›"}
          </button>
        )}

        {/* Main content */}
        <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? "12px 14px" : "18px 24px" }}>
          {/* Topic header */}
          <div style={{
            background: `linear-gradient(135deg, ${topic.color}15, var(--bg-section-header) 60%)`,
            border: `1px solid ${topic.color}35`,
            borderRadius: 11,
            padding: "14px 18px",
            marginBottom: 18,
            display: "flex",
            alignItems: "center",
            gap: 12
          }}>
            <span style={{ fontSize: 28 }}>{topic.icon}</span>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: topic.color }}>{topic.title}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{topic.subtitle}</div>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
            {[
              { key: "content", label: "Study Content" },
              { key: "quiz", label: `Exam Questions (${topic.quiz.length})` }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                style={{
                  padding: "7px 18px",
                  background: activeTab === tab.key ? topic.color : "var(--bg-section-header)",
                  border: `1px solid ${activeTab === tab.key ? topic.color : "var(--border-primary)"}`,
                  borderRadius: 20,
                  cursor: "pointer",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: 0.5,
                  color: activeTab === tab.key ? "#000" : "var(--text-muted)",
                  textTransform: "uppercase",
                  transition: "all 0.2s"
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {isMobile && active === TIMED_EXAM_ID && examTimer.started && (
            <ExamTimerPanel
              timer={examTimer}
              color={topic.color}
              totalQuestions={topic.quiz.length}
              onReset={resetExamTimer}
              compact
            />
          )}

          {/* Content tab */}
          {activeTab === "content" && topic.sections.map((section, i) => {
            const key = `${topic.id}-${i}`;
            const isOpen = openSections[key] !== false;
            return (
              <div key={key} style={{
                marginBottom: 12,
                border: "1px solid var(--border-primary)",
                borderRadius: 10,
                overflow: "hidden",
                background: "var(--bg-card)"
              }}>
                <button
                  onClick={() => toggleSection(key)}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "11px 15px",
                    background: "var(--bg-section-header)",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <div style={{
                      width: 6, height: 6, borderRadius: "50%",
                      background: topic.color,
                      boxShadow: `0 0 7px ${topic.color}`
                    }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
                      {section.heading}
                    </span>
                  </div>
                  <span style={{ color: topic.color, fontSize: 15, fontWeight: 700 }}>
                    {isOpen ? "−" : "+"}
                  </span>
                </button>
                {isOpen && (
                  <div style={{ padding: "14px 16px" }}>
                    <div
                      style={{ fontSize: 16, lineHeight: 1.8, color: "var(--text-secondary)", marginBottom: 12 }}
                      dangerouslySetInnerHTML={{ __html: section.content }}
                    />
                    {section.code && (
                      <div style={{
                        background: "var(--bg-code)",
                        border: `1px solid ${topic.color}28`,
                        borderRadius: 8,
                        padding: "12px 14px",
                        overflow: "auto"
                      }}>
                        <div style={{
                          fontSize: 9, color: topic.color, letterSpacing: 2,
                          marginBottom: 7, textTransform: "uppercase", fontWeight: 700
                        }}>
                          CODE EXAMPLE
                        </div>
                        <pre style={{
                          margin: 0, fontSize: 11, lineHeight: 1.7,
                          whiteSpace: "pre-wrap", wordBreak: "break-word"
                        }}>
                          {section.code.split("\n").map((line, li) => {
                            const isComment = line.trim().startsWith("//") || line.trim().startsWith("'");
                            const isHighlight = line.trim().startsWith("->") || line.trim().startsWith("->");
                            return (
                              <span key={li} style={{
                                color: isComment ? "#475569" : isHighlight ? "#86EFAC" : "#7DD3FC",
                                display: "block"
                              }}>
                                {line}
                              </span>
                            );
                          })}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Quiz tab */}
          <div style={{
            display: activeTab === "quiz" ? "block" : "none",
            background: "var(--bg-card)",
            border: "1px solid var(--border-primary)",
            borderRadius: 10,
            padding: "16px"
          }}>
            <QuizSection
              key={`${topic.id}-${topic.id === TIMED_EXAM_ID ? examTimer.resetKey : 0}`}
              questions={topic.quiz}
              color={topic.color}
              label={topic.quizLabel}
              questionTimes={topic.id === TIMED_EXAM_ID ? examTimer.completedTimes : undefined}
              onQuestionFocus={topic.id === TIMED_EXAM_ID ? focusTimedQuestion : undefined}
              onQuestionSubmit={topic.id === TIMED_EXAM_ID ? submitTimedQuestion : undefined}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
