(function () {
  "use strict";

  var navGroups = [
    { label: "START HERE", items: [{ id: "overview", label: "Field guide", glyph: "00" }] },
    { label: "FOUNDATIONS", items: [
      { id: "net", label: "Networking basics", glyph: "01" },
      { id: "net-addressing", label: "Addresses & subnets", glyph: "01a" },
      { id: "net-routing", label: "Routing & gateways", glyph: "01b" },
      { id: "net-services", label: "DNS, ports & protocols", glyph: "01c" },
      { id: "net-troubleshooting", label: "Network troubleshooting", glyph: "01d" },
      { id: "nmap", label: "Nmap", glyph: "02" },
      { id: "zen", label: "Zenmap", glyph: "03" },
      { id: "ws", label: "Wireshark", glyph: "04" },
      { id: "linux", label: "Linux essentials", glyph: "05" }
    ] },
    { label: "WEB VULNERABILITIES", items: [
      { id: "web", label: "Module overview", glyph: "06" },
      { id: "demo-lab", label: "Practice Bench", glyph: "LAB" },
      { id: "v-sqli", label: "SQL injection", glyph: "a" },
      { id: "v-idor", label: "IDOR", glyph: "b" },
      { id: "v-traversal", label: "Path traversal", glyph: "c" },
      { id: "v-bac", label: "Broken access control", glyph: "d" },
      { id: "v-xss", label: "Reflected XSS", glyph: "e" },
      { id: "v-cmdi", label: "Command injection", glyph: "f" },
      { id: "compare", label: "Compare & review", glyph: "↔" }
    ] },
    { label: "REFERENCE", items: [{ id: "quickref", label: "Quick reference", glyph: "R" }] }
  ];

  var networkTerms = [
    ["IP address", "A logical address used to identify a device on an IP network.", "Helps tools and routers identify where packets should go. Keep real target details inside the approved lab."],
    ["MAC address", "A link-layer identifier associated with a network interface.", "It can help distinguish devices on the same local network."],
    ["Private address space", "Address ranges reserved for use inside local networks.", "Useful context when reading local network diagrams and traffic."],
    ["Subnet mask", "A value that separates the network portion of an address from the host portion.", "It describes which devices are considered part of the same local network."],
    ["Default gateway", "The router a device uses to reach destinations outside its local network.", "Traffic for other networks is usually sent to this next hop."],
    ["DNS", "The naming system that maps domain names to network addresses.", "DNS requests often appear before a client connects to a service."],
    ["DHCP", "A protocol that assigns network settings to devices automatically.", "It explains how devices receive addresses and why those assignments can change."],
    ["Ports", "Numbered communication endpoints associated with network services.", "An open port can indicate that a service is listening; it does not prove the service is vulnerable."],
    ["TCP", "A connection-oriented transport protocol that tracks delivery and ordering.", "Common application protocols use TCP when reliable delivery matters."],
    ["UDP", "A connectionless transport protocol with lower delivery guarantees.", "DNS and real-time applications may use UDP, depending on the protocol."],
    ["Client", "A device or program that requests a service.", "In a packet capture, the client commonly begins a request and the server responds."],
    ["Access point", "A network device that connects wireless clients to a local network.", "It provides the wireless link between Wi-Fi clients and the rest of the network."],
    ["Router", "A device that forwards traffic between separate networks.", "It selects a next hop for packets that need to leave the local network."],
    ["CIDR prefix", "A compact way to show how many leading address bits identify a network, such as /24.", "It helps describe an approved subnet without listing every device."],
    ["HTTP", "The request-and-response protocol used by many web applications.", "A browser sends a method, path, headers, and sometimes a body; the server returns a status, headers, and content."],
    ["HTTPS and TLS", "HTTPS protects HTTP traffic with TLS encryption and integrity checks.", "A packet capture can still show connection metadata, but application content is generally encrypted."],
    ["NAT", "Network address translation maps addresses between network boundaries.", "It explains why a device's local address may differ from the address seen outside its network."],
    ["Latency and loss", "Latency is delivery delay; loss is traffic that fails to arrive as expected.", "They can cause slow or intermittent services without indicating a security issue."],
    ["Firewall", "A policy enforcement point that permits or blocks traffic based on rules.", "It can affect whether a scan sees a port as open, closed, or filtered."],
    ["Subnet", "A logical grouping of IP addresses that share a network prefix.", "The prefix and routing rules help determine whether traffic is local or sent to a gateway."]
  ];

  var nmapLessons = [
    { title: "Host discovery", purpose: "Check which devices respond within an approved scope without performing a port scan.", command: "nmap -sn <approved-scope>", observe: "Look for hosts reported as up. A missing response is not always proof that a device is offline." },
    { title: "Basic port scan", purpose: "Check common TCP ports on one approved host.", command: "nmap <approved-host>", observe: "Open means a service is listening; closed means the host replied with no listener; filtered means a filter prevented a clear answer." },
    { title: "Service and version detection", purpose: "Probe open ports to identify likely services and versions.", command: "nmap -sV <approved-host>", observe: "Treat service banners and version guesses as clues to verify, not definitive inventory." },
    { title: "Operating system detection", purpose: "Estimate the operating system from how a host responds to probes.", command: "nmap -O <approved-host>", observe: "The result is a fingerprint-based estimate and may be inconclusive." },
    { title: "Broader assessment", purpose: "Combine service checks and selected scripts for a more detailed view.", command: "nmap -A <approved-host>", observe: "This creates more traffic and can take longer. Use it only when the written scope permits it." },
    { title: "All TCP ports", purpose: "Check the full TCP port range when the approved exercise calls for it.", command: "nmap -p- <approved-host>", observe: "A complete range check takes longer than the default scan." },
    { title: "Verbose output", purpose: "Show additional progress and detail while a scan runs.", command: "nmap -v <approved-host>", observe: "Useful for understanding scan progress; it does not change the authorized scope." }
  ];

  var linuxGroups = [
    { title: "Navigation", rows: [
      ["pwd", "Show the current directory", "Prints the path of the working directory."],
      ["ls -la", "List files", "Shows hidden entries and detailed file information."],
      ["cd ..", "Move to the parent directory", "Use a relative path to move between folders."],
      ["cd ~/practice", "Move using a home-relative path", "The tilde expands to the current user's home directory in common shells."],
      ["realpath notes.txt", "Resolve a path", "Shows the normalized absolute path; inspect it before scripts or file operations."],
      ["tree -L 2", "Preview a folder layout", "Shows a shallow directory tree when the optional tree utility is installed."]
    ] },
    { title: "Files and folders", rows: [
      ["touch notes.txt", "Create an empty file", "Also updates the timestamp if the file already exists."],
      ["mkdir -p practice/notes", "Create nested folders", "The parent folders are created when needed."],
      ["cp source.txt copy.txt", "Copy a file", "Use a separate disposable practice folder for exercises."],
      ["mv draft.txt archive/", "Move or rename a file", "Check the source and destination before moving."],
      ["rm -- old-note.txt", "Remove a file", "Deletion may not be recoverable. Only use disposable practice files."],
      ["file sample.bin", "Identify a file type", "Reads file signatures and metadata; a filename extension alone is not proof of type."],
      ["du -sh practice/", "Estimate folder size", "Summarizes disk usage for a folder in a readable unit."],
      ["tar -tf sample.tar", "List an archive safely", "Displays archive members without extracting them; inspect paths before unpacking."],
      ["sha256sum sample.bin", "Calculate a file hash", "Produces a checksum useful for comparing a file with a trusted reference."],
      ["strings -n 6 sample.bin", "Find readable text in a binary", "Shows printable text fragments; treat them as clues, not as a complete analysis."],
      ["xxd -l 64 sample.bin", "Inspect a file header", "Shows a short hexadecimal and text view of the first bytes."]
    ] },
    { title: "View files", rows: [
      ["cat notes.txt", "Print a short file", "Use for small files where all content fits on screen."],
      ["less notes.txt", "Read a longer file", "Press q to exit; use / to search within the file."],
      ["head -n 10 notes.txt", "Show the first lines", "Useful for checking a file's opening structure."],
      ["tail -n 10 notes.txt", "Show the last lines", "tail -f can follow a changing log."],
      ["wc -l app.log", "Count lines", "Useful for a quick size check before reading or filtering a large file."]
    ] },
    { title: "Search", rows: [
      ["grep -i \"error\" app.log", "Find matching text", "The -i option ignores letter case."],
      ["find . -name \"*.log\"", "Find files by name", "The dot starts the search in the current directory."],
      ["grep -n \"denied\" app.log", "Show matching line numbers", "Line numbers make it easier to revisit a finding in a larger file."],
      ["grep -R \"TODO\" ./src", "Search a folder tree", "Recursive search examines files below the chosen directory; keep the scope narrow."]
    ] },
    { title: "Permissions", rows: [
      ["ls -l", "Inspect permissions", "Read/write/execute bits are shown for owner, group, and others."],
      ["chmod u+x script.sh", "Adjust an executable bit", "Change permissions only when you understand who needs access."],
      ["umask", "Inspect default permission mask", "The mask removes permissions from newly created files and folders."],
      ["chown user:group file", "Change ownership", "Requires appropriate privileges; verify the exact target before changing ownership."]
    ] },
    { title: "Networking on your own machine", rows: [
      ["ip addr", "View local interfaces", "Shows addresses assigned to your own network interfaces."],
      ["ip -br addr", "Summarize interfaces", "Shows interface names, state, and addresses in a compact view."],
      ["ip route", "View the routing table", "Shows connected routes and the default route used to reach other networks."],
      ["ip route show default", "Show the default gateway", "Displays the default route and its next-hop gateway when one is configured."],
      ["ip -6 route", "View IPv6 routes", "Shows the IPv6 routing table, including a configured default route."],
      ["ip route get <approved-ip>", "Check a route decision", "Shows the interface and next hop the local kernel would use for a permitted destination."],
      ["ip neigh", "View local neighbor entries", "Shows cached link-layer mappings for nearby IPv4 or IPv6 devices."],
      ["getent hosts <lab-name>", "Check configured name resolution", "Looks up a name using the host's configured name-service sources."],
      ["dig <lab-name>", "Inspect a DNS answer", "Queries DNS and displays record and resolver details; dig may need separate installation."],
      ["ping -c 4 <approved-host>", "Check basic reachability", "Sends four ICMP echo requests; a blocked response does not prove a host is offline."],
      ["tracepath <approved-host>", "Observe the route path", "Attempts to show network hops and path MTU information; intermediate devices may not reply."],
      ["ss -tuln", "List listening sockets", "Helps review services listening on the local machine."],
      ["ss -tn", "List TCP connections", "Shows current TCP connection states on the local system."],
      ["getent hosts example.test", "Check local name resolution", "Uses the machine's configured name-service sources; use only a lab name you control."],
      ["curl -I https://example.test", "Inspect response headers", "Sends a web request and shows response headers; use a permitted lab endpoint."]
    ] },
    { title: "System information", rows: [
      ["whoami", "Show the current user", "Useful context before running a permitted administrative task."],
      ["uname -a", "Show kernel and system details", "Reports operating system and architecture information."],
      ["hostname", "Show the machine name", "Helps distinguish systems in your own lab."],
      ["ps -ef", "List processes", "Shows running processes; inspect your own lab system and avoid terminating unknown services."],
      ["journalctl -n 20", "Read recent system journal entries", "Provides recent system messages on systems using systemd; logs may contain sensitive details."],
      ["python3 --version", "Check Python availability", "Confirms whether Python 3 is installed before using a supplied analysis script."],
      ["history", "Review recent shell commands", "Helps reproduce your own work; inspect before sharing because it may contain sensitive values."]
    ] }
  ];

  var linuxWhy = {
    "pwd": "Use it before relative-path work so you know exactly which folder a command will affect.",
    "ls -la": "Use it to find hidden configuration files and inspect ownership, permissions, sizes, and timestamps.",
    "cd ..": "Use it to move up one level when navigating a supplied folder tree.",
    "cd ~/practice": "Use it to return to a known practice location without depending on the current folder.",
    "realpath notes.txt": "Use it to confirm where a symbolic or relative path resolves before opening or changing a file.",
    "tree -L 2": "Use it to understand a practice bundle's folder structure quickly; use it only when available and permitted.",
    "touch notes.txt": "Use it to create a scratch file for notes in a disposable workspace.",
    "mkdir -p practice/notes": "Use it to prepare a predictable working area and avoid mixing scratch files with supplied originals.",
    "cp source.txt copy.txt": "Use it to preserve an original before experimenting with a copy.",
    "mv draft.txt archive/": "Use it to organize or rename files after checking both paths and avoiding accidental overwrites.",
    "rm -- old-note.txt": "Use it only to remove a confirmed disposable file; it is included to teach caution, not as a routine step.",
    "file sample.bin": "Use it when an extension is missing or misleading and you need a first clue about a file's actual format.",
    "du -sh practice/": "Use it to spot unexpectedly large folders before copying, extracting, or reviewing their contents.",
    "tar -tf sample.tar": "Use it to inspect archive member names and spot unexpected paths before extraction.",
    "sha256sum sample.bin": "Use it to verify a copy against a trusted reference or record a stable evidence identifier.",
    "strings -n 6 sample.bin": "Use it as a quick clue for readable text in a provided binary; it is not a full analysis.",
    "xxd -l 64 sample.bin": "Use it to inspect magic bytes and headers when identifying an unfamiliar supplied file.",
    "cat notes.txt": "Use it for short notes or snippets that fit comfortably on screen.",
    "less notes.txt": "Use it for longer text because it pages and searches without printing the whole file at once.",
    "head -n 10 notes.txt": "Use it to preview a file's first lines before deciding how to search or parse it.",
    "tail -n 10 notes.txt": "Use it to inspect the newest lines of a log or output file.",
    "wc -l app.log": "Use it to estimate log size and choose a manageable review method.",
    "grep -i \"error\" app.log": "Use it to locate case-insensitive error clues without reading every log line.",
    "find . -name \"*.log\"": "Use it to locate relevant log files under the current supplied folder.",
    "grep -n \"denied\" app.log": "Use it to find matching lines and preserve line numbers for later review.",
    "grep -R \"TODO\" ./src": "Use it to search a scoped source folder for markers that may explain unfinished behavior.",
    "ls -l": "Use it to review owner, group, and permission bits before running or editing a file.",
    "chmod u+x script.sh": "Use it only when a trusted, in-scope script needs its owner-execute bit set; inspect it first.",
    "umask": "Use it to understand which permissions are removed from newly created files by default.",
    "chown user:group file": "Use it only for authorized administration when ownership is the issue; it normally needs elevated permission.",
    "ip addr": "Use it to see local IPv4/IPv6 addresses and interface state that affect connectivity.",
    "ip -br addr": "Use it for a compact interface summary when comparing local interfaces.",
    "ip route": "Use it to find connected networks and the default gateway for destinations outside them.",
    "ip route show default": "Use it to identify the gateway and interface that receive traffic for destinations without a more-specific route.",
    "ip -6 route": "Use it to inspect IPv6 routes separately from the IPv4 routing table.",
    "ip route get <approved-ip>": "Use it to ask which interface and next hop the local system would use for one in-scope address.",
    "ip neigh": "Use it to inspect local neighbor resolution when a device on the same link cannot be reached.",
    "getent hosts <lab-name>": "Use it to check the configured name-resolution path used by many local applications.",
    "dig <lab-name>": "Use it when DNS record details or resolver responses are needed beyond a simple lookup.",
    "ping -c 4 <approved-host>": "Use it as a small reachability clue; firewalls may block ICMP, so interpret no reply cautiously.",
    "tracepath <approved-host>": "Use it to investigate route and path-MTU clues; intermediate devices may not respond.",
    "ss -tuln": "Use it to review locally listening TCP/UDP sockets without making a remote scan.",
    "ss -tn": "Use it to inspect local TCP connection states while diagnosing an application connection.",
    "getent hosts example.test": "Use it to check local name resolution for the reserved example name in a lesson.",
    "curl -I https://example.test": "Use it to inspect response headers from a permitted test service without downloading the body.",
    "whoami": "Use it to confirm which local account will own files or run a permitted command.",
    "uname -a": "Use it to identify the local kernel and architecture when choosing compatible tools.",
    "hostname": "Use it to label notes when working across multiple authorized lab systems.",
    "ps -ef": "Use it to review processes on your own lab machine when identifying an active service.",
    "journalctl -n 20": "Use it to inspect recent system messages when diagnosing a service you administer.",
    "python3 --version": "Use it to confirm the interpreter version before using a trusted supplied helper.",
    "history": "Use it to reproduce your own recent work; inspect and redact it before sharing."
  };

  var vulnerabilities = [
    {
      id: "sqli", route: "v-sqli", name: "SQL Injection", category: "Injection", impact: "High",
      one: "Input changes the meaning of a database query.",
      what: "SQL injection occurs when an application combines untrusted input with query text. The database can then interpret part of that input as instructions instead of as a value.",
      surfaces: [
        ["Authentication and account forms", "User-entered values that are looked up in a database."],
        ["Search and filters", "Keywords, categories, sort choices, and other values used to build queries."],
        ["Record lookups", "Application features that retrieve stored records from a supplied value."],
        ["Application logging", "Headers or cookies that are stored or queried by application code."]
      ],
      flow: [
        ["Input arrives", "A request supplies a value the application will use in a query."],
        ["Query is assembled", "Unsafe code joins the value directly into query text."],
        ["Parser sees syntax", "The database cannot reliably distinguish data from instructions."],
        ["Data boundary fails", "The resulting query may return or change data beyond the intended operation."]
      ],
      focus: ["Trace untrusted values into queries; confirm the query structure stays fixed.", "Use synthetic records only in an approved lab.", "Treat database errors as a review signal; do not probe further."],
      why: ["Expose records outside the intended result set.", "Change or remove stored information.", "Undermine authentication and other application controls."],
      fix: ["Use parameterized queries for every value; do not build query syntax from input.", "Limit database permissions to the application’s needs.", "Validate expected types and return generic errors while logging details safely."],
      misses: ["Relying on a short character denylist.", "Escaping values by hand instead of using parameters.", "Using a privileged database account for ordinary application work."],
      unsafe: "query = \"SELECT * FROM items WHERE name = '\" + input + \"'\"\nexecute(query)",
      safer: "query = \"SELECT * FROM items WHERE name = ?\"\nexecute(query, [input])",
      check: ["What is the root cause?", "The application mixes user-controlled data into query syntax.", "Which control separates query structure from user input?", "Parameterized queries keep values as data."],
      control: "Parameterized queries"
    },
    {
      id: "idor", route: "v-idor", name: "IDOR", full: "Insecure Direct Object Reference", category: "Authorization", impact: "High",
      one: "A record identifier is accepted without checking who may access that record.",
      what: "IDOR is an authorization failure in which an application uses a direct object reference, such as a record identifier, but fails to confirm that the current user is allowed to read or change that object.",
      surfaces: [
        ["Personal records", "Profiles, orders, invoices, or documents selected by an identifier."],
        ["Download features", "A resource is selected by an ID without an ownership check."],
        ["Update and delete actions", "A request identifies a record but authorization is checked incompletely."],
        ["Multi-tenant services", "Records belonging to another organization are not isolated correctly."]
      ],
      flow: [
        ["User is authenticated", "The server knows the identity of the current session."],
        ["Object is requested", "A request names a record the application can look up."],
        ["Ownership check is skipped", "The server checks that the record exists but not who may access it."],
        ["Private action succeeds", "The record is returned or changed outside the user's permission."]
      ],
      focus: ["Compare two synthetic accounts and verify each can access only its own records.", "Check read, update, and delete actions separately.", "Confirm the server uses the signed-in session to determine identity."],
      why: ["Expose personal or organization data.", "Allow unauthorized changes to another user's records.", "Break tenant boundaries even when authentication works."],
      fix: ["Check ownership or sharing permission on every object request.", "Enforce authorization on the server for reads and changes.", "Use deny-by-default rules and scope queries to records the signed-in user may access."],
      misses: ["Assuming a long or random identifier is secret.", "Checking only that the user is signed in.", "Trusting an account or owner value sent by the browser."],
      unsafe: "record = getRecord(request.recordId)\nreturn record",
      safer: "record = getRecordVisibleTo(\n  request.recordId,\n  session.userId\n)\nreturn record",
      check: ["What does authentication establish?", "It establishes who is making the request, not which records they may access.", "Where must an object permission check run?", "On the server, for every operation involving that object."],
      control: "Per-object authorization"
    },
    {
      id: "traversal", route: "v-traversal", name: "Path Traversal", category: "File handling", impact: "High",
      one: "A file name can escape the folder the application intended to expose.",
      what: "Path traversal occurs when an application builds a filesystem path from untrusted input without ensuring that the resolved path remains inside an approved directory.",
      surfaces: [
        ["Downloads and previews", "A feature selects a file from a supplied name."],
        ["Image and media handling", "A user-controlled value is mapped to a local file."],
        ["Template or theme selection", "A request influences which server-side file is loaded."],
        ["Localization resources", "A language or resource selector is converted directly into a path."]
      ],
      flow: [
        ["A name is accepted", "The application receives a file selector from the request."],
        ["A path is built", "The value is joined with a base directory."],
        ["The path is resolved", "Filesystem rules normalize separators and parent-directory references."],
        ["The boundary is crossed", "If containment is not checked, a different file may be reached."]
      ],
      focus: ["Trace how a file selector becomes a resolved path.", "Check that the normalized path stays inside the approved directory.", "Use synthetic files and avoid exposing local paths in errors."],
      why: ["Expose configuration, source, or other files the feature was not meant to serve.", "Read data available to the application process.", "Increase impact when the service has broad filesystem permissions."],
      fix: ["Map safe IDs to approved files where practical.", "Resolve the final path and verify it remains inside the allowed directory.", "Allow only known file names and limit filesystem permissions."],
      misses: ["Removing one known sequence before path normalization.", "Checking a path before decoding or canonicalizing it.", "Giving the web process access to more files than it needs."],
      unsafe: "path = baseDirectory + userFileName\nreturn readFile(path)",
      safer: "path = resolve(baseDirectory, userFileName)\nif not isInside(path, baseDirectory):\n  reject()\nreturn readFile(path)",
      check: ["When should containment be checked?", "After resolving the final canonical path.", "What is a stronger alternative to accepting file paths?", "Map a safe identifier to an approved file on the server."],
      control: "Canonical path containment"
    },
    {
      id: "bac", route: "v-bac", name: "Broken Access Control", category: "Authorization", impact: "High",
      one: "The server does not consistently enforce what each user may do or see.",
      what: "Broken access control is a broad class of authorization failures. Authentication identifies a user; authorization must separately decide whether that user may perform each requested action.",
      surfaces: [
        ["Administrative functions", "Privileged pages or actions that rely on interface visibility."],
        ["State-changing operations", "Updates, exports, deletion, or configuration changes without a server-side permission check."],
        ["Role and profile changes", "Sensitive fields accepted from a client without a strict permission rule."],
        ["Alternate request paths", "Different methods or API layers that do not share the same authorization policy."]
      ],
      flow: [
        ["A user signs in", "The application identifies a valid account."],
        ["A protected action is requested", "The request reaches a server-side function."],
        ["The permission check is absent or inconsistent", "The server relies on a hidden button, a partial check, or a stale role."],
        ["The action is allowed incorrectly", "A user performs an operation outside their assigned role."]
      ],
      focus: ["Compare synthetic roles against the same set of actions.", "Check the server response, not just whether a button is visible.", "Review direct actions and alternate methods for consistent policy."],
      why: ["Expose administrative data or capabilities.", "Let ordinary accounts change important settings or records.", "Make other weaknesses more damaging."],
      fix: ["Enforce authorization on the server for every request.", "Use explicit deny-by-default permissions and protect role assignment.", "Log denied high-risk actions and review policy changes."],
      misses: ["Hiding links instead of denying the request.", "Checking permissions on a page but not its underlying action.", "Trusting role values supplied by the client."],
      unsafe: "if user.isSignedIn:\n  runPrivilegedAction()",
      safer: "requirePermission(user, \"records:manage\")\nrunPrivilegedAction()",
      check: ["What is the difference between authentication and authorization?", "Authentication identifies the user; authorization decides which actions and data are allowed.", "Is hiding a control enough?", "No. The server must reject an unauthorized request."],
      control: "Server-side permission checks"
    },
    {
      id: "xss", route: "v-xss", name: "Reflected XSS", full: "Reflected Cross-Site Scripting", category: "Injection", impact: "Medium",
      one: "Untrusted request content is returned in a page and interpreted by the browser as markup or script.",
      what: "Reflected cross-site scripting occurs when an application includes request data in an immediate response without context-appropriate output encoding. The browser may interpret that data as part of the page rather than as text.",
      surfaces: [
        ["Search and status messages", "A page repeats a search term or message from the current request."],
        ["Validation responses", "A form redisplays a submitted value after an error."],
        ["Page titles and labels", "Request values appear in HTML attributes or text nodes."],
        ["Diagnostics", "Request metadata is included in a response or diagnostic page."]
      ],
      flow: [
        ["Request carries text", "A value enters the application through a request."],
        ["The response reflects it", "The server inserts the value into HTML."],
        ["Output context is not encoded", "The browser receives characters with their structural meaning intact."],
        ["The browser interprets content", "The response can alter the page in the site's security context."]
      ],
      focus: ["Find where request text is reflected into a response.", "Check that output encoding matches its HTML, attribute, or script context.", "Use an inert local sample and confirm the browser treats it as text."],
      why: ["Change what a user sees on a trusted page.", "Perform actions as the user when other protections are weak.", "Expose page data available to the browser context."],
      fix: ["Use template-based output encoding for the exact output context.", "Avoid constructing HTML strings from untrusted input.", "Add Content Security Policy and secure cookie settings as extra layers."],
      misses: ["Using HTML encoding for a different output context.", "Relying only on input filtering.", "Disabling safe template defaults."],
      unsafe: "html = \"<p>\" + userInput + \"</p>\"\nrenderHTML(html)",
      safer: "renderText(\"p\", userInput)\n// Template encodes text for HTML output",
      check: ["What determines the right output encoding?", "The context where the value is inserted.", "Should user text be assembled into HTML strings?", "No. Use a safe text or template API that encodes output."],
      control: "Context-aware output encoding"
    },
    {
      id: "cmdi", route: "v-cmdi", name: "Command Injection", category: "Injection", impact: "High",
      one: "Input changes how an operating-system command is assembled or interpreted.",
      what: "Command injection can occur when an application passes untrusted input into a shell command string. Shell syntax may then cause the input to change what the server executes.",
      surfaces: [
        ["Network diagnostics", "A web feature wraps a system utility instead of using a library."],
        ["File converters", "A service starts a command-line converter using request data."],
        ["Archive and backup tools", "A workflow builds operating-system commands from file or option values."],
        ["Maintenance controls", "Administrative features invoke scripts or utilities."]
      ],
      flow: [
        ["A feature accepts input", "A value is intended to be an argument to a utility."],
        ["The application builds a command string", "Untrusted input is concatenated with command text."],
        ["A shell parses the string", "The shell interprets control syntax instead of treating the value as one argument."],
        ["The server runs unintended work", "The process acts with the privileges available to the application."]
      ],
      focus: ["Identify features that start operating-system processes.", "Prefer libraries; otherwise check how arguments are separated and validated.", "Use a mock process in an isolated lab, never on a shared or production server."],
      why: ["Run unintended operations on the server.", "Access files or services available to the application process.", "Escalate the effect of an application flaw."],
      fix: ["Use a library or pass structured arguments to a fixed executable without a shell.", "Validate against a narrow allow-list and reject unexpected input.", "Run the service with minimal operating-system permissions."],
      misses: ["Blocking only a few known separator characters.", "Validating only in browser code.", "Running the application process with administrator privileges."],
      unsafe: "command = \"lookup \" + userInput\nrunShell(command)",
      safer: "runProcess(\n  executable = \"lookup\",\n  arguments = [validatedValue],\n  shell = false\n)",
      check: ["What creates the parsing risk?", "Putting untrusted input into a shell command string.", "What is safer when a process is necessary?", "Use a fixed executable and pass validated arguments separately without a shell."],
      control: "Structured process arguments"
    }
  ];

  var lessonGuides = {
    sqli: {
      analogy: "A form value should go into a labeled envelope for the database. String-built SQL tears open the envelope and lets the value rewrite the instructions.",
      context: "A toy course catalog searches a title using a query assembled from one text field.",
      sample: "' OR '1'='1' --",
      parts: ["The first quote closes the application's text value.", "OR adds a second condition; '1'='1' is true for every row.", "The comment marker makes the remainder of this toy query irrelevant."],
      vulnerable: "The toy query's meaning changes, so the practice catalog shows all three synthetic courses.",
      defended: "A parameterized query treats the complete sample as one title value, so the catalog finds no matching course.",
      steps: ["Start with the ordinary sample and observe the small result set.", "Keep the same synthetic input and compare the vulnerable and defended policies.", "Notice whether the database query structure changes, not just whether an error appears.", "Reset the sample and explain why parameters preserve the query structure."]
    },
    idor: {
      analogy: "A library card number identifies a book record; it does not prove that the person holding the number may view another member's checkout history.",
      context: "Two fictional learners have separate records in an in-page practice service.",
      sample: "record-102",
      parts: ["The request names a record directly.", "The server must derive the signed-in learner from the session.", "It must check ownership or an explicit sharing rule before returning the record."],
      vulnerable: "The toy service returns the synthetic record even though it belongs to the other learner.",
      defended: "The per-record permission check denies the request and leaves the other learner's sample private.",
      steps: ["Use only the two fictional accounts and records supplied by the lesson.", "Compare an allowed record with the other sample record.", "Check the response for read, edit, and delete actions separately.", "Do not enumerate identifiers or try this against real accounts."]
    },
    traversal: {
      analogy: "A room number should select a room inside the training building. A path that climbs parent folders can leave the intended building unless the resolved location is checked.",
      context: "The simulator contains a tiny in-memory folder with a public handout and a synthetic private note; it never reads the device's files.",
      sample: "../private/coach-notes.txt",
      parts: ["The two dots mean move to a parent folder.", "The slash continues into another folder.", "The important check is whether the final resolved file remains inside the approved practice folder."],
      vulnerable: "The in-memory model resolves the sample outside the public folder and displays its fictional note.",
      defended: "The containment rule rejects a resolved location outside the approved folder.",
      steps: ["Observe the normal public handout first.", "Compare the same sample under both policies.", "Look for a containment decision after path normalization.", "Keep the exercise inside this synthetic model; never substitute a real system path."]
    },
    bac: {
      analogy: "Hiding the staff-room button does not lock the staff-room door. The server must check the visitor's permission whenever the action is requested.",
      context: "A fictional learner requests a course-settings action that is reserved for instructors.",
      sample: "Learner role → manage course settings",
      parts: ["Authentication identifies the learner.", "The requested action changes protected course settings.", "Authorization must compare the learner's server-side permissions with that action."],
      vulnerable: "The toy endpoint accepts the action because it checks only that a user is signed in.",
      defended: "The server-side role policy returns a denied response for the learner and permits the instructor sample.",
      steps: ["Compare the learner and instructor roles using the supplied toy action.", "Try the conceptual action through the direct request view, not just the navigation menu.", "Check read and change actions independently.", "Confirm the decision happens on the server for every request."]
    },
    xss: {
      analogy: "A notice board should print a student's words as text. If the page treats those words as markup, the words can become instructions to the browser.",
      context: "A search page reflects the query back into a result heading. This lesson displays all examples inertly and never runs browser script.",
      sample: "<script>alert('training')</script>",
      parts: ["The opening and closing tags mark a script element in HTML.", "The text between them is JavaScript in a browser that interprets it as markup.", "Safe output encoding shows the characters literally instead of creating an element."],
      vulnerable: "The toy page marks the response as untrusted markup and shows a simulated browser alert panel; no script executes.",
      defended: "The page treats the value as text, so the tag characters appear literally in the result.",
      steps: ["Use only the inert sample shown here and watch the local toy page response.", "Switch policies and compare a simulated markup interpretation with literal text.", "Inspect the response context: text, attribute, and script contexts need different handling.", "Remember reflected input appears in the immediate response; it is different from stored XSS."]
    },
    cmdi: {
      analogy: "A utility should receive one labeled argument. Passing a sentence through a shell is like asking an interpreter to decide whether punctuation means part of the value or a second instruction.",
      context: "A mock status utility accepts a value in an in-page model. No operating-system command is started.",
      sample: "status; whoami",
      parts: ["The semicolon is a shell command separator.", "Text after it could become a second command if input is placed in a shell string.", "Structured argument passing keeps the whole value as one argument to a fixed program."],
      vulnerable: "The simulator labels the input as two parsed command segments and displays fictional output only.",
      defended: "The fixed-argument model treats the complete value as one argument and rejects it as an unexpected status value.",
      steps: ["Compare the displayed parse in the two policies; neither starts a process.", "Identify which punctuation the shell would interpret as syntax.", "Review whether the application uses a library or a fixed executable with separate arguments.", "Keep any real process testing inside a written, isolated lab scope."]
    }
  };

  var demoConfigs = {
    sqli: {
      kind: "text", label: "Sample query value", sample: "' OR '1'='1' --",
      pageName: "Product search", pagePath: "/search", brand: "MarketSquare", theme: "shop", navigation: "SHOP  ·  DEALS  ·  ORDERS  ·  ACCOUNT",
      hint: "The sample is a concrete tautology payload. Compare how string-built SQL and a parameterized query treat the same value."
    },
    idor: {
      kind: "text", label: "Synthetic record ID", sample: "record-102",
      pageName: "Member profile", pagePath: "/members/record-102", brand: "Circle", theme: "social", navigation: "HOME  ·  PEOPLE  ·  MESSAGES  ·  PROFILE",
      hint: "Member A is signed in. record-101 belongs to Member A; record-102 belongs to Member B in the fictional profile store."
    },
    traversal: {
      kind: "text", label: "File selector", sample: "../private/coach-notes.txt",
      pageName: "File preview", pagePath: "/drive/preview", brand: "CloudBox", theme: "cloud", navigation: "MY DRIVE  ·  SHARED  ·  RECENT  ·  STORAGE",
      hint: "The sample asks for a synthetic note outside the toy public folder. The app model uses an in-memory map and never opens a device file."
    },
    bac: {
      kind: "access", label: "Choose a test role", sample: "student",
      pageName: "Site settings", pagePath: "/admin/settings", brand: "PageCraft", theme: "admin", navigation: "DASHBOARD  ·  PAGES  ·  USERS  ·  SETTINGS",
      hint: "Try changing site settings as Student or Instructor. The roles and permission policy exist only in this page."
    },
    xss: {
      kind: "text", label: "Text reflected by a page", sample: "<script>alert('training')</script>",
      pageName: "Community search", pagePath: "/community/search", brand: "Forumly", theme: "forum", navigation: "TOPICS  ·  MEMBERS  ·  GUIDELINES  ·  SIGN IN",
      hint: "The sample shows a script tag commonly used to demonstrate reflected XSS. It stays inert text; the simulator never inserts HTML or runs JavaScript."
    },
    cmdi: {
      kind: "text", label: "Utility argument", sample: "status; whoami",
      pageName: "Service health", pagePath: "/console/services", brand: "HostPanel", theme: "host", navigation: "OVERVIEW  ·  SERVICES  ·  LOGS  ·  SETTINGS",
      hint: "The sample includes a shell command separator. Observe how an unsafe shell string can split it, then compare a fixed-argument policy. No process starts."
    }
  };

  var byId = {};
  vulnerabilities.forEach(function (v) { byId[v.id] = v; });

  function esc(value) {
    return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function list(items, className) {
    return '<ul class="check-list ' + (className || "") + '">' + items.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>";
  }
  function codeCard(title, code) {
    return '<div class="code-card"><div class="code-label"><span>' + esc(title) + '</span><button class="copy-btn" type="button">Copy</button></div><pre><code>' + esc(code) + "</code></pre></div>";
  }
  function tabs(group, unsafe, safer) {
    return '<div class="code-tabs" role="tablist" aria-label="Code pattern comparison">' +
      '<button class="tab-btn" type="button" role="tab" aria-selected="true" data-tab="unsafe">Unsafe pattern</button>' +
      '<button class="tab-btn" type="button" role="tab" aria-selected="false" data-tab="safer">Safer pattern</button></div>' +
      '<div class="tab-panels" data-tab-group="' + group + '">' +
      '<div class="tab-panel active" data-panel="unsafe">' + codeCard("Illustrative pattern", unsafe) + "</div>" +
      '<div class="tab-panel" data-panel="safer">' + codeCard("Defensive pattern", safer) + "</div></div>";
  }
  function lessonHeader(eyebrow, title, lead, index) {
    return '<div class="lesson-head"><div class="title-wrap"><p class="eyebrow">' + esc(eyebrow) + "</p><h1>" + title +
      '</h1><p class="lead">' + esc(lead) + '</p></div><div class="lesson-index">LESSON <b>' + esc(index) + "</b></div></div>";
  }
  function lessonBlock(num, title, body) {
    return '<section class="lesson-block"><h2><span>' + num + "</span>" + title + "</h2>" + body + "</section>";
  }
  function infoDisclosure(title, body) {
    return '<details><summary>' + title + '</summary><div class="details-body">' + body + '</div></details>';
  }

  function renderLessonWalkthrough(v) {
    var guide = lessonGuides[v.id];
    return '<div class="analogy-card"><span class="lesson-kicker">A SIMPLE WAY TO PICTURE IT</span><p>' + esc(guide.analogy) + '</p></div>' +
      '<div class="example-context"><span class="lesson-kicker">SYNTHETIC EXAMPLE</span><p>' + esc(guide.context) + '</p><div class="example-value"><span>INPUT / REQUEST</span><code>' + esc(guide.sample) + '</code></div></div>' +
      '<div class="example-grid"><article class="example-card"><span class="lesson-kicker">WHAT TO NOTICE</span>' + list(guide.parts) + '</article><article class="example-card"><span class="lesson-kicker">VULNERABLE MODEL</span><p>' + esc(guide.vulnerable) + '</p><span class="example-outcome unsafe-outcome">BOUNDARY FAILS</span></article><article class="example-card"><span class="lesson-kicker">DEFENDED MODEL</span><p>' + esc(guide.defended) + '</p><span class="example-outcome safe-outcome">CONTROL APPLIES</span></article></div>';
  }
  function lessonActions(nextId) {
    return '<div class="lesson-actions">' +
      (nextId ? '<button class="next-btn" type="button" data-go="' + nextId + '">Next lesson&nbsp; →</button>' : "") + "</div>";
  }
  function aside(control, type, hint) {
    return '<aside class="lesson-aside"><div class="aside-card"><span class="aside-label">Primary control</span><strong>' + esc(control) + '</strong><p>Build this control into the design and verify it on the server.</p></div>' +
      '<div class="aside-card"><span class="aside-label">Risk family</span><strong>' + esc(type) + '</strong><p>Understand the trust boundary before reviewing the implementation.</p></div>' +
      '<div class="aside-card"><span class="aside-label">Practice note</span><p>' + esc(hint) + "</p></div></aside>";
  }

  function renderOverview() {
    var courses = [
      ["01", "Networking basics", "Understand addressing, name resolution, ports, protocols, and how traffic crosses a network.", "20 core terms", "net"],
      ["02", "Nmap", "Plan an authorized discovery workflow and interpret host, port, and service results.", "7 command patterns", "nmap"],
      ["03", "Zenmap", "Connect a graphical scan workflow to its generated Nmap command and results.", "Guided workflow", "zen"],
      ["04", "Wireshark", "Follow a conversation from packet overview to protocol details with display filters.", "6 display filters", "ws"],
      ["05", "Linux essentials", "Navigate, inspect files, search logs, understand permissions, and review your lab system.", "7 command groups", "linux"],
      ["06", "Web vulnerabilities", "Study six common weaknesses through causes, safe review questions, and defenses.", "6 lessons", "web"]
    ];
    return '<section class="hero"><div class="hero-copy"><p class="eyebrow">FIELD NOTES 01&nbsp; / &nbsp;DEFENSIVE PRACTICE</p><h1>Learn to see<br>the seam.</h1><p class="lead">A practical cybersecurity field manual for understanding systems, reading what they reveal, and building safer software.</p><div class="hero-actions"><button class="btn" type="button" data-go="net">Begin the field guide <span>→</span></button><button class="btn btn-light" type="button" data-go="demo-lab">Enter the Practice Bench <span>↗</span></button><span class="hero-note">Concepts first. Practice with permission.</span></div></div><div class="hero-art" aria-hidden="true"></div></section>' +
      '<div class="stats-strip"><div class="stat"><b>05</b><span>Foundations<br>and tools</span></div><div class="stat"><b>06</b><span>Web weakness<br>lessons</span></div><div class="stat"><b>01</b><span>Rule that travels<br>with every lesson</span></div></div>' +
      '<div class="section-head"><h2>Choose a learning track</h2><span class="minor">A FIELD GUIDE, NOT A CHECKLIST</span></div>' +
      '<div class="grid">' + courses.map(function (c) {
        return '<button class="card course-card" type="button" data-go="' + c[4] + '"><span class="course-index">TRACK ' + c[0] + "</span><h3>" + c[1] + "</h3><p>" + c[2] + '</p><span class="card-foot"><span>' + c[3] + '</span><span>OPEN GUIDE ↗</span></span></button>';
      }).join("") + "</div>" +
      '<div class="section-head"><h2>A steady learning path</h2><span class="minor">FOUNDATION → OBSERVATION → REVIEW</span></div>' +
      '<div class="path-row">' + [["net", "Network"], ["nmap", "Discover"], ["ws", "Observe"], ["linux", "Operate"], ["web", "Assess"], ["compare", "Review"]].map(function (x, i) {
        return '<button class="path-step" type="button" data-go="' + x[0] + '"><span>' + (i + 1) + "</span>" + x[1] + "</button>";
      }).join("") + "</div>" +
      '<div class="section-head"><h2>Three habits for safer work</h2><span class="minor">KEEP THESE CLOSE</span></div>' +
      '<div class="grid">' +
      '<article class="principle"><span class="principle-num">01 / SCOPE</span><h3>Know what is in bounds</h3><p>Practice only on systems you own or have explicit written permission to assess.</p></article>' +
      '<article class="principle"><span class="principle-num">02 / EVIDENCE</span><h3>Observe before concluding</h3><p>A scan or message is a signal to understand. Validate findings in a safe, controlled environment.</p></article>' +
      '<article class="principle"><span class="principle-num">03 / DESIGN</span><h3>Make trust explicit</h3><p>Keep data separate from instructions, and enforce access where the server can verify it.</p></article></div>';
  }

  function renderNetwork() {
    return lessonHeader("Foundation / 01", "Networking basics", "Learn the path from an interface and address to a routed connection and application response. Study one focused chapter at a time.", "01") +
      '<div class="module-intro"><span class="intro-mark"><span>↗</span></span><p>When a connection works, several layers are cooperating. When it fails, locate the failing step rather than guessing: interface, address, route, name resolution, transport, then application.</p></div>' +
      '<div class="section-head"><h2>Choose a chapter</h2><span class="minor">FOUR CONNECTED LESSONS</span></div>' +
      '<div class="grid two">' + [
        ["net-addressing", "01 · Addresses & subnets", "IPv4 and IPv6, CIDR prefixes, private ranges, and local-link identifiers."],
        ["net-routing", "02 · Routing & gateways", "Routing tables, default gateways, next hops, NAT, and neighbor resolution."],
        ["net-services", "03 · DNS, ports & protocols", "DNS and DHCP, TCP and UDP, ports, HTTP, HTTPS, and TLS."],
        ["net-troubleshooting", "04 · Network troubleshooting", "A repeatable diagnostic sequence from interface to application." ]
      ].map(function (chapter) {
        return '<button class="card course-card" type="button" data-go="' + chapter[0] + '"><span class="course-index">NETWORK FIELD NOTE</span><h3>' + chapter[1] + '</h3><p>' + chapter[2] + '</p><span class="card-foot"><span>CONCEPTS · COMMANDS · PRACTICE</span><span>OPEN ↗</span></span></button>';
      }).join("") + "</div>" +
      lessonActions("net-addressing");
  }

  function networkChapter(title, lead, concepts, fieldNotes, next) {
    return lessonHeader("Foundation / Networking", title, lead, "01") +
      '<div class="grid two">' + concepts.map(function (item, i) {
        return '<article class="card"><span class="course-index">CONCEPT 0' + (i + 1) + '</span><h3>' + esc(item[0]) + '</h3><p>' + esc(item[1]) + '</p><p><strong>Why it matters:</strong> ' + esc(item[2]) + '</p>' + (item[3] ? codeCard("Linux example", item[3]) : "") + '</article>';
      }).join("") + "</div>" +
      lessonBlock("03", "Practical checks", list(fieldNotes)) +
      lessonBlock("Q", "Check your understanding", '<details><summary>What should you record?</summary><div class="details-body">Record the question you were checking, the sample or endpoint, the observation, and what remains uncertain. Keep confidential values and personal data out of shared notes.</div></details>') +
      lessonActions(next);
  }

  function renderNetworkAddressing() {
    return networkChapter("Addresses & subnets", "An address identifies a network interface. A prefix describes which destinations are local and which need a router.", [
      ["IPv4 and IPv6", "IPv4 addresses are 32 bits and are commonly written as four decimal octets. IPv6 addresses are 128 bits and use hexadecimal groups. An address belongs to an interface; one machine can have several interfaces and addresses.", "Record the address family and interface when diagnosing a connection. Do not assume a host has only one address.", "ip -br addr"],
      ["CIDR prefix and subnet", "CIDR writes the network prefix after a slash, for example 192.0.2.0/24. The /24 means 24 leading bits describe the network; the remaining 8 bits provide 256 IPv4 address values. In a conventional /24 broadcast subnet, one value identifies the network and one is the broadcast address, leaving 254 host addresses. A subnet mask expresses the same boundary in another form.", "The prefix helps decide whether a destination should be reached directly or through a gateway. Addressing has exceptions—such as point-to-point /31 links—and IPv6 does not use broadcast addresses, so follow the actual network plan.", "ip addr"],
      ["Private and public ranges", "The common private IPv4 blocks are 10.0.0.0/8, 172.16.0.0/12, and 192.168.0.0/16. They are meant for internal routing; public addresses are globally allocated. Network address translation (NAT) may let internal hosts share an external address. The 192.0.2.0/24 range used in examples is reserved for documentation.", "Private addressing describes routing scope, not trust. A private service can still be exposed within its network; use only addresses you are authorized to assess.", "ip route"],
      ["MAC address and local link", "A MAC address is used for delivery on a local link, while an IP address supports routing between networks. ARP (IPv4) or Neighbor Discovery (IPv6) helps map a nearby IP to a link-layer address. This mapping is usually needed for the next hop, which may be the destination or the gateway.", "This distinction helps separate local-link problems from routing or application problems.", "ip neigh"]
    ], ["Keep the prefix attached to an address; omitting it can change which network it describes.", "Record hostname, address, port, and service as separate facts rather than merging them into one guess.", "Check your own interface configuration before drawing conclusions about a remote endpoint."], "net-routing");
  }

  function renderNetworkRouting() {
    return networkChapter("Routing & gateways", "Routers move packets between networks. A host consults its routing table to choose a directly connected path or a next hop, commonly the default gateway.", [
      ["Local or remote destination", "The sender compares the destination with its connected subnet. A destination on the same link can be reached directly; an off-subnet destination is sent to a router.", "A correct address can still fail to reach an outside service if the route or gateway is missing.", "ip route"],
      ["Default gateway", "A default route is the fallback when no more-specific route matches. It usually points to a local router. The gateway is the next hop, not the final destination.", "Check which gateway is configured before assuming a remote service is down.", "ip route show default"],
      ["Route selection", "A routing table can contain several routes. Systems generally prefer the most-specific matching prefix, then use metrics or policy to choose among comparable paths.", "The route actually selected for one destination is more useful than guessing from a diagram.", "ip route get <approved-ip>"],
      ["Neighbor resolution and NAT", "On a local link, the system needs a link-layer address for its next hop. NAT can rewrite addresses at a network boundary, but it does not replace routing or application protocols.", "A stale neighbor entry can disrupt local delivery; NAT can make observed source addresses differ across boundaries.", "ip neigh"]
    ], ["Check the selected route for one authorized destination instead of scanning a wider range to diagnose a connection.", "Record the interface and next hop locally; avoid publishing internal network details.", "Treat an incomplete route trace as a clue because routers may suppress diagnostic replies."], "net-services");
  }

  function renderNetworkServices() {
    return networkChapter("DNS, ports & protocols", "Names, transport protocols, and application protocols answer different questions. A browser resolves a name, connects to a host and port, then exchanges an application request.", [
      ["DNS and DHCP", "DNS resolves names to records such as A (IPv4), AAAA (IPv6), CNAME (alias), MX (mail routing), and TXT (text data). DHCP leases settings such as an address, gateway, and resolver; the familiar exchange is Discover, Offer, Request, Acknowledge. DNS answers may be cached or differ by resolver.", "A name-resolution failure can look like an application outage even when a direct in-scope address responds. A DHCP issue can leave a device without a usable route or resolver.", "getent hosts <lab-name>"],
      ["TCP", "TCP establishes a connection and tracks delivery and order. The three-way handshake begins SYN, SYN-ACK, ACK. Retries and connection states describe behavior but do not alone identify a cause.", "Use timing and connection state as evidence when a service stalls or repeatedly retries.", "ss -tn"],
      ["UDP and ports", "UDP sends datagrams without TCP's connection and delivery guarantees. A port is a 16-bit transport endpoint, numbered 0–65535. Common conventions divide ports into well-known, registered, and dynamic/private ranges, but local assignments and actual service behavior still require confirmation.", "Confirm service behavior rather than relying on a port label alone; TCP and UDP can each use the same number for different endpoints.", "ss -tuln"],
      ["HTTP, HTTPS, and TLS", "HTTP requests and responses include methods, paths, headers, status codes, and sometimes a body. HTTPS is HTTP protected by TLS, which encrypts traffic and checks integrity; certificate validation helps authenticate the server.", "A passive capture of HTTPS generally reveals connection metadata but not the protected application body.", "curl -I https://example.test"]
    ], ["Record a name, resolved address, port, protocol, and response separately.", "Distinguish a successful transport connection from an application-level error response.", "Use the names and services supplied for your authorized lab; examples here are generic or reserved placeholders."], "net-troubleshooting");
  }

  function renderNetworkTroubleshooting() {
    return lessonHeader("Foundation / Networking", "Network troubleshooting", "Work from the local interface toward the application. Change one variable at a time so the result points to the layer that needs attention.", "04") +
      '<div class="flow"><article class="flow-step"><strong>01 · LINK</strong><p>Is the expected interface up and configured?</p></article><article class="flow-step"><strong>02 · ADDRESS</strong><p>Does the local address and prefix make sense?</p></article><article class="flow-step"><strong>03 · ROUTE</strong><p>Which next hop will the system select?</p></article><article class="flow-step"><strong>04 · SERVICE</strong><p>Does the name resolve and does the expected service respond?</p></article></div>' +
      '<div class="grid two"><article class="card"><h3>1. Check local configuration</h3><p>Inspect interface state and addresses. If the lab machine lacks an expected address, remote service checks may be premature.</p>' + codeCard("Local interfaces", "ip -br addr") + '</article><article class="card"><h3>2. Check the route</h3><p>Ask which interface and gateway would be used for one authorized destination.</p>' + codeCard("Selected route", "ip route get <approved-ip>") + '</article><article class="card"><h3>3. Check name resolution</h3><p>Resolve the provided name using configured lookup sources; treat a DNS answer as separate evidence from reachability.</p>' + codeCard("Configured lookup", "getent hosts <lab-name>") + '</article><article class="card"><h3>4. Check the application response</h3><p>If the endpoint is in scope, inspect its status and headers. A response proves an application answered, not that its content is correct.</p>' + codeCard("Response headers", "curl -I https://example.test") + '</article></div>' +
      lessonActions("nmap");
  }

  function renderNmap() {
    return lessonHeader("Foundation / 02", "Nmap", "A network discovery and security-auditing tool. Learn what each result can tell you—and what it cannot.", "02") +
      '<div class="note"><span><strong>Scope first.</strong> All command examples use placeholders. Replace them only with an approved lab scope or host covered by written authorization.</span></div>' +
      lessonBlock("01", "What Nmap can do", '<div class="grid two"><article class="card"><h3>Discover hosts</h3><p>Identify systems that respond within a permitted network range.</p></article><article class="card"><h3>Inspect ports</h3><p>Check whether services appear open, closed, or filtered.</p></article><article class="card"><h3>Identify services</h3><p>Collect service and version clues from responding ports.</p></article><article class="card"><h3>Build context</h3><p>Combine findings with network diagrams and owner-provided asset records.</p></article></div>') +
      '<div class="section-head"><h2>Essential scan patterns</h2><span class="minor">COMMAND · PURPOSE · WHAT TO NOTICE</span></div>' +
      '<div class="grid two">' + nmapLessons.map(function (item, i) {
        return '<article class="card"><span class="eyebrow">PATTERN 0' + (i + 1) + "</span><h3>" + esc(item.title) + "</h3><p>" + esc(item.purpose) + "</p>" +
          codeCard("Example syntax", item.command) + '<p><strong>Read the result.</strong> ' + esc(item.observe) + "</p></article>";
      }).join("") + "</div>" +
      '<div class="section-head"><h2>Read a scan result</h2><span class="minor">SYNTHETIC DOCUMENTATION-NETWORK EXAMPLE</span></div>' +
      '<div class="grid two"><article class="card"><span class="eyebrow">SAMPLE SUMMARY</span><pre class="sample-output"><code>Host is up (0.012s latency).\nPORT     STATE     SERVICE\n22/tcp   open      ssh\n80/tcp   open      http\n443/tcp  filtered  https</code></pre><p>This is a fictional example using a documentation-only address placeholder. It teaches result reading; it is not a target.</p></article><article class="card"><span class="eyebrow">INTERPRET WITH CARE</span><h3>State is an observation</h3><p><strong>Open:</strong> a service accepted or answered the probe. <strong>Closed:</strong> the host replied, but no service was listening on that port. <strong>Filtered:</strong> a network control prevented a clear classification.</p><p>A service name is a best-effort label, not proof of product or version. Confirm findings through authorized inventory and owner context.</p></article></div>' +
      infoDisclosure("What to record in an authorized scan note", "<p>Record the approved scope, time window, tool and relevant options, high-level results, uncertainties, and any unexpected service impact. Store detailed output according to the organization's data-handling rules.</p>") +
      lessonBlock("02", "Responsible workflow", list(["Confirm the scope, timing, and allowed scan intensity before starting.", "Begin with the least intrusive check that answers the question.", "Record the command, time, and relevant output for an authorized report.", "Stop if the activity causes unexpected service impact and contact the system owner."])) +
      lessonBlock("03", "Check your understanding", '<details><summary>Does “filtered” mean that a service is vulnerable?</summary><div class="details-body">No. It means the scan did not receive enough information to classify the port clearly, often because a filter affected the response.</div></details><details><summary>Should a version string be treated as verified inventory?</summary><div class="details-body">No. It is a useful clue that should be confirmed against trusted asset information.</div></details>') +
      lessonActions("zen");
  }

  function renderZenmap() {
    var fields = [
      ["Target", "The approved host or scope to include in the scan."],
      ["Profile", "A preset of scan options chosen for a particular level of detail."],
      ["Command", "The Nmap command Zenmap assembles from the selected options."],
      ["Scan", "Starts the scan and displays the resulting output."],
      ["Output", "Shows discovered hosts, ports, and service information."],
      ["Topology", "Can visualize relationships between responding hosts."]
    ];
    return lessonHeader("Foundation / 03", "Zenmap", "A graphical interface for Nmap. It uses the same scanning engine and can make command options easier to inspect.", "03") +
      '<div class="grid two"><article class="card"><span class="eyebrow">COMMAND LINE</span><h3>Nmap</h3><p>Direct control, repeatable commands, and flexible options. A good fit when you know which checks are in scope.</p><div class="tag-line"><span class="pill blue">Precise</span><span class="pill blue">Scriptable</span></div></article><article class="card"><span class="eyebrow">GRAPHICAL WORKFLOW</span><h3>Zenmap</h3><p>A visual way to choose a profile and inspect the command it generates. Useful when learning how options relate.</p><div class="tag-line"><span class="pill">Visual</span><span class="pill">Profile based</span></div></article></div>' +
      '<div class="section-head"><h2>Read the interface</h2><span class="minor">THE COMMAND FIELD IS A TEACHING TOOL</span></div>' +
      '<div class="term-grid">' + fields.map(function (f, i) {
        return '<article class="term-card"><span class="course-index">0' + (i + 1) + "</span><h3>" + f[0] + "</h3><p class=\"definition\">" + f[1] + "</p></article>";
      }).join("") + "</div>" +
      '<div class="section-head"><h2>Use the interface as a learning loop</h2><span class="minor">SET → INSPECT → RUN → REVIEW</span></div>' +
      '<div class="grid two"><article class="card"><h3>1. Set a permitted target</h3><p>Use only the host or range provided for the lab. Keep scope and timing visible before choosing a profile.</p></article><article class="card"><h3>2. Inspect the generated command</h3><p>Notice how profile choices become options. Check whether service detection, scripts, or broader probes are enabled.</p></article><article class="card"><h3>3. Run the smallest useful check</h3><p>Choose a low-impact profile that answers the question. A graphical interface does not reduce scan traffic or risk.</p></article><article class="card"><h3>4. Review and save context</h3><p>Read hosts, ports, and service clues together. Save the command and result with the authorized exercise notes.</p></article></div>' +
      '<div class="note neutral"><span>Choose a profile only after confirming the permitted scope. Read the generated command before starting the scan so its intensity is clear.</span></div>' +
      lessonBlock("01", "Check your understanding", '<details><summary>What is the relationship between Zenmap and Nmap?</summary><div class="details-body">Zenmap provides a graphical workflow around the Nmap scanning engine. The interface does not change the need for authorization or careful scope.</div></details>') +
      lessonActions("ws");
  }

  function renderWireshark() {
    var panes = [
      ["Interface selection", "Choose an interface that you are permitted to monitor."],
      ["Packet list", "Scan the captured conversations by time, source, destination, and protocol."],
      ["Packet details", "Expand protocol fields for the selected packet."],
      ["Packet bytes", "Inspect the raw bytes that make up the selected packet."]
    ];
    var filters = [
      ["dns", "DNS traffic", "Focus on name-resolution packets."],
      ["tcp", "TCP traffic", "Show packets carried by TCP."],
      ["udp", "UDP traffic", "Show packets carried by UDP."],
      ["icmp", "ICMP traffic", "Review diagnostic and network-control messages."],
      ["tcp.port == 443", "TCP port 443", "Narrow the view to traffic using this service port."],
      ["tls", "TLS protocol", "Focus on packets Wireshark identifies as TLS."]
    ];
    return lessonHeader("Foundation / 04", "Wireshark", "A protocol analyzer for capturing and inspecting network traffic you are authorized to observe.", "04") +
      '<div class="note"><span>Capture only traffic that you own or have explicit permission to monitor. Packet captures can contain private information; store and share them carefully.</span></div>' +
      '<div class="section-head"><h2>Four panes to know</h2><span class="minor">FROM OVERVIEW TO DETAIL</span></div>' +
      '<div class="grid two">' + panes.map(function (p, i) {
        return '<article class="card"><span class="course-index">PANE 0' + (i + 1) + "</span><h3>" + p[0] + "</h3><p>" + p[1] + "</p></article>";
      }).join("") + "</div>" +
      '<div class="section-head"><h2>Display filters</h2><span class="minor">FILTER THE VIEW, NOT THE CAPTURE</span></div>' +
      '<div class="grid two">' + filters.map(function (f) {
        return '<article class="card">' + codeCard("Display filter", f[0]) + '<h3>' + f[1] + "</h3><p>" + f[2] + "</p></article>";
      }).join("") + "</div>" +
      '<div class="section-head"><h2>Follow one conversation</h2><span class="minor">A PRACTICAL PACKET-REVIEW ROUTINE</span></div>' +
      '<div class="grid two"><article class="card"><h3>Start broad, then narrow</h3><p>Find the relevant host and time window in the packet list. Apply a display filter to focus the view without changing the capture.</p></article><article class="card"><h3>Expand protocol layers</h3><p>Select one packet and inspect Ethernet, IP, transport, and application fields. Each layer answers a different question.</p></article><article class="card"><h3>Compare request and response</h3><p>Look for direction, timing, retries, and response codes. A missing reply may have several causes, including routing or filtering.</p></article><article class="card"><h3>Account for encryption</h3><p>TLS generally hides application content from a passive capture. Metadata such as endpoints, timing, and packet sizes may remain visible.</p></article></div>' +
      infoDisclosure("Capture filters and display filters", "<p>A <strong>capture filter</strong> limits which packets are recorded and can discard evidence before review. A <strong>display filter</strong> narrows what is shown from packets already captured. Keep an original capture when policy permits and apply display filters during analysis.</p>") +
      '<div class="note neutral"><span>A display filter narrows what you see in an existing capture. A capture filter limits what is recorded in the first place. Check the filter bar’s validity indicator before relying on a result.</span></div>' +
      lessonBlock("01", "Check your understanding", '<details><summary>What is the difference between a packet list and packet details?</summary><div class="details-body">The packet list gives a summary of many packets. Packet details show the protocol fields for one selected packet.</div></details>') +
      lessonActions("linux");
  }

  function renderLinux() {
    return lessonHeader("Foundation / 05", "Linux essentials", "A compact command-line guide for navigating folders, reading files, searching, and understanding your own lab machine.", "05") +
      '<div class="note neutral"><span>Use commands in a disposable practice folder. Be especially careful with commands that move, overwrite, or remove files.</span></div>' +
      linuxGroups.map(function (group, gi) {
        return '<div class="section-head"><h2>' + esc(group.title) + '</h2><span class="minor">GROUP 0' + (gi + 1) + '</span></div><div class="grid two">' +
          group.rows.map(function (row) {
            return '<article class="card">' + codeCard("Command", row[0]) + "<h3>" + esc(row[1]) + '</h3><p><strong>What it does:</strong> ' + esc(row[2]) + '</p><p class="command-why"><strong>Why use it:</strong> ' + esc(linuxWhy[row[0]] || "Use it when this information helps answer the current, authorized lab question.") + "</p></article>";
          }).join("") + "</div>";
      }).join("") +
      '<div class="section-head"><h2>Combine commands safely</h2><span class="minor">PIPE · REDIRECT · INSPECT</span></div>' +
      '<div class="grid two"><article class="card">' + codeCard("Pipe output into a search", "grep -i \"warning\" app.log | head -n 20") + '<p><strong>What it does:</strong> A pipe sends matching log lines to <code>head</code>, which limits the display to 20 lines.</p><p class="command-why"><strong>Why use it:</strong> Narrow a large log to a manageable set of relevant clues without flooding the terminal.</p></article><article class="card">' + codeCard("Save a command result", "ss -tuln > listening-sockets.txt") + '<p><strong>What it does:</strong> The greater-than operator writes output to a file and replaces its previous contents.</p><p class="command-why"><strong>Why use it:</strong> Save a local snapshot for later comparison; choose a new disposable filename so you do not overwrite useful work.</p></article><article class="card"><h3>Understand standard streams</h3><p><strong>stdin</strong> is input, <strong>stdout</strong> is normal output, and <strong>stderr</strong> is diagnostic output. Redirection can send each stream to a different destination.</p></article><article class="card"><h3>Check before changing</h3><p>Use <code>pwd</code>, inspect the exact path, and understand the command options before moving, overwriting, changing permissions, or removing anything.</p></article></div>' +
      '<div class="section-head"><h2>Read command results in context</h2><span class="minor">A SHORT FIELD ROUTINE</span></div>' +
      '<div class="grid two"><article class="card"><h3>Know where you are</h3><p>Confirm the working directory and the user before using a relative path or an administrative command.</p></article><article class="card"><h3>Inspect, then filter</h3><p>Start with a small output sample. Use a narrow search term or line count before scanning a large log.</p></article><article class="card"><h3>Check permissions</h3><p>In <code>ls -l</code>, read owner, group, and permission bits. Grant only the access needed for the task.</p></article><article class="card"><h3>Protect logs and data</h3><p>Logs can contain names, tokens, paths, or other sensitive data. Keep practice output synthetic and store captures or logs only as policy allows.</p></article></div>' +
      lessonBlock("01", "Check your understanding", '<details><summary>How can you leave a file viewer such as less?</summary><div class="details-body">Press q to quit and return to the shell.</div></details><details><summary>What should you check before removing a file?</summary><div class="details-body">Confirm the current directory and the exact file path, and make sure the file is disposable.</div></details>') +
      lessonActions("web");
  }

  function renderWebOverview() {
    return lessonHeader("Web security / 06", "Web vulnerabilities", "Six common weaknesses, taught through where they arise, how the failure happens, what to review safely, and how to prevent it.", "06") +
      '<div class="note neutral"><span>These lessons use general software examples and synthetic data. The Practice Bench compares request handling and server decisions without connecting to real services.</span></div><button class="btn btn-small" type="button" data-go="demo-lab">Open the Practice Bench&nbsp; →</button>' +
      '<div class="section-head"><h2>The review loop</h2><span class="minor">REPEAT THESE QUESTIONS</span></div>' +
      '<div class="grid">' +
      '<article class="principle"><span class="principle-num">01 / SURFACE</span><h3>Where does trust cross?</h3><p>Find the input, object, file, or action that crosses into a protected system boundary.</p></article>' +
      '<article class="principle"><span class="principle-num">02 / FAILURE</span><h3>What check is missing?</h3><p>Trace the behavior to the parser, filesystem, process, browser, or authorization rule.</p></article>' +
      '<article class="principle"><span class="principle-num">03 / CONTROL</span><h3>Where is it enforced?</h3><p>Prefer controls that keep data separate and let the server verify each request.</p></article></div>' +
      '<div class="section-head"><h2>Six lessons</h2><span class="minor">SELECT A TOPIC TO OPEN ITS FIELD NOTE</span></div>' +
      '<div class="grid">' + vulnerabilities.map(function (v, i) {
        return '<button class="card course-card" type="button" data-go="' + v.route + '"><span class="course-index">WEB 0' + (i + 1) + " / " + esc(v.category.toUpperCase()) + '</span><h3>' + esc(v.name) + '<span class="impact ' + (v.impact === "Medium" ? "medium" : "") + '">' + esc(v.impact) + "</span></h3><p>" + esc(v.one) + '</p><span class="card-foot"><span>CONTROL: ' + esc(v.control.toUpperCase()) + '</span><span>OPEN ↗</span></span></button>';
      }).join("") + "</div>" +
      '<div class="section-head"><h2>Three defensive principles</h2><span class="minor">A USEFUL DEFAULT FOR EVERY FEATURE</span></div>' +
      '<div class="grid"><article class="principle"><span class="principle-num">A / INPUT</span><h3>Treat input as data</h3><p>Keep user values separate from query, shell, path, and markup instructions.</p></article><article class="principle"><span class="principle-num">B / SERVER</span><h3>Verify each request</h3><p>Authorization belongs at the server boundary and must cover each object and action.</p></article><article class="principle"><span class="principle-num">C / ACCESS</span><h3>Limit what can happen</h3><p>Use narrow permissions for application accounts, processes, and stored data.</p></article></div>';
  }

  function miniSiteDocument(v) {
    var config = demoConfigs[v.id];
    var scenario = JSON.stringify(v.id);
    var sample = JSON.stringify(config.sample).replace(/</g, "\\u003c");
    var pageName = JSON.stringify(config.pageName);
    var pagePath = JSON.stringify(config.pagePath);
    var initialScript = [
      "(function(){",
      "var kind=" + scenario + ", sample=" + sample + ", pageName=" + pageName + ", pagePath=" + pagePath + ", vulnerable=true;",
      "var page=document.getElementById('page'), address=document.getElementById('address'), badge=document.getElementById('badge'), result=document.getElementById('result'), field=null, role=null, action=null;",
      "function node(tag,cls,text){var n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;}",
      "function add(parent,tag,cls,text){var n=node(tag,cls,text);parent.appendChild(n);return n;}",
      "function card(title,body,kindName){var c=node('article','site-card');if(kindName)add(c,'span','site-label',kindName);add(c,'h3','',title);if(body)add(c,'p','',body);return c;}",
      "function note(title,body,tone){var n=node('div','site-notice '+(tone||''));add(n,'strong','',title);add(n,'p','',body);return n;}",
      "function queryPath(){var val=field?field.value:'';if(kind==='sqli')return pagePath+'?term='+encodeURIComponent(val);if(kind==='idor')return '/members/'+encodeURIComponent(val);if(kind==='traversal')return pagePath+'?file='+encodeURIComponent(val);if(kind==='xss')return pagePath+'?q='+encodeURIComponent(val);if(kind==='cmdi')return pagePath+'?arg='+encodeURIComponent(val);return pagePath+'?role='+encodeURIComponent(role.value)+'&action='+encodeURIComponent(action.value);}",
      "function hasTautology(v){return /\\bOR\\s+['\\\"]?1['\\\"]?\\s*=\\s*['\\\"]?1['\\\"]?/i.test(v);}",
      "function outcome(){var v=field?field.value:'';if(kind==='sqli'){if(vulnerable&&hasTautology(v))return {state:'exposed',title:'Query changed · 3 products returned',body:'The search condition became true for every item in this synthetic shop.'};if(!vulnerable)return {state:'safe',title:'Protected search · 0 matches',body:'The complete input is treated as one product name.'};return {state:'neutral',title:'No matching products',body:'Try the loaded sample or a product name.'};}",
      "if(kind==='idor'){if(v==='record-101')return {state:'safe',title:'Your profile',body:'Member A · My saved post'};if(v==='record-102'&&vulnerable)return {state:'exposed',title:'Another member profile exposed',body:'Member B · Private post (fictional sample)'};if(v==='record-102')return {state:'blocked',title:'403 · Profile access denied',body:'The signed-in member does not own this profile.'};return {state:'neutral',title:'404 · Profile not found',body:'No matching profile exists in the fictional profile store.'};}",
      "if(kind==='traversal'){var climbs=v.split(/[\\\\/]+/).some(function(part){return part==='..';});if(climbs&&vulnerable)return {state:'exposed',title:'Private lesson note displayed',body:'Instructor review notes · synthetic sample only'};if(climbs)return {state:'blocked',title:'403 · Outside lesson library',body:'The resolved path is not contained in the public materials folder.'};if(v.trim()==='lesson.txt')return {state:'safe',title:'Public lesson opened',body:'Welcome to the course materials library.'};return {state:'neutral',title:'404 · File not found',body:'Try lesson.txt or the preloaded sample.'};}",
      "if(kind==='bac'){if(action.value==='read')return {state:'safe',title:'Public page opened',body:'This page is available to Student and Instructor.'};if(vulnerable)return {state:'exposed',title:'Settings saved · authorization missing',body:'The simulated Student session was allowed to manage site settings.'};if(role.value==='instructor')return {state:'safe',title:'Settings saved',body:'Instructor permission was checked successfully.'};return {state:'blocked',title:'403 · Permission required',body:'Student does not have manage-site permission.'};}",
      "if(kind==='xss'){var markup=/<[a-z][^>]*>/i.test(v), alertText=v.match(/alert\\s*\\(\\s*(['\\\"])(.*?)\\1\\s*\\)/i);if(markup&&vulnerable)return {state:'exposed',title:'Search result reflected unsafely',body:v,alert:alertText?alertText[2]:''};if(markup)return {state:'safe',title:'Search value displayed as text',body:v};return {state:'neutral',title:'Search results',body:v||'Enter a course or sample text.'};}",
      "var split=/;|&&|\\|\\||\\|/.test(v);if(split&&vulnerable)return {state:'exposed',title:'Two synthetic operations shown',body:'service status: training-online\\nsecond operation: [simulated output]'};if(split)return {state:'blocked',title:'400 · Argument rejected',body:'A shell separator was blocked. No process was started.'};return {state:'safe',title:'Service available',body:'The value was treated as one literal argument.'};}",
      "function render(){var o=outcome();badge.textContent=o.title;badge.className='site-status '+o.state;address.textContent=queryPath();result.replaceChildren();",
      "if(kind==='sqli'){result.appendChild(note(o.title,o.body,o.state));if(o.state==='exposed'){var grid=node('div','site-grid');[['Studio headphones','$48 · Audio'],['Compact keyboard','$32 · Accessories'],['Travel speaker','$56 · Audio']].forEach(function(x){grid.appendChild(card(x[0],x[1]));});result.appendChild(grid);}else result.appendChild(card('Product search',o.body,'SEARCH RESPONSE'));}",
      "else if(kind==='idor')result.appendChild(card(o.title,o.body,'MEMBER PROFILE'));",
      "else if(kind==='traversal'){result.appendChild(note(o.title,o.body,o.state));if(o.state==='exposed'||o.state==='safe')result.appendChild(card(o.state==='exposed'?'Instructor review notes':'Welcome to the public lesson',o.body,o.state==='exposed'?'PRIVATE SAMPLE':'PUBLIC LESSON'));}",
      "else if(kind==='bac')result.appendChild(note(o.title,o.body,o.state));",
      "else if(kind==='xss'){var reflected=card(o.title,o.body,'SEARCH RESULT');reflected.classList.add('reflected');result.appendChild(reflected);if(o.state==='exposed'&&o.alert){var dialog=node('div','site-alert');add(dialog,'span','site-label','SIMULATED BROWSER ALERT');add(dialog,'strong','','forgefracture.test says');add(dialog,'p','',o.alert);result.appendChild(dialog);}}",
      "else{result.appendChild(note(o.title,o.body,o.state));if(o.state==='exposed')result.appendChild(card('Service output','service status: training-online\\nprocess identity: app-user','SIMULATED OUTPUT'));}",
      "}",
      "document.querySelectorAll('[data-mode]').forEach(function(b){b.addEventListener('click',function(){vulnerable=b.getAttribute('data-mode')==='vulnerable';document.querySelectorAll('[data-mode]').forEach(function(x){var on=x===b;x.classList.toggle('selected',on);x.setAttribute('aria-pressed',String(on));});render();});});",
      "if(kind==='bac'){role=document.getElementById('role');action=document.getElementById('action');role.addEventListener('change',render);action.addEventListener('change',render);}",
      "else{var form=document.getElementById('input-form');field=document.getElementById('sample');form.addEventListener('submit',function(e){e.preventDefault();render();field.focus();});field.addEventListener('input',render);}",
      "document.getElementById('reset').addEventListener('click',function(){vulnerable=true;document.querySelectorAll('[data-mode]').forEach(function(b){var on=b.getAttribute('data-mode')==='vulnerable';b.classList.toggle('selected',on);b.setAttribute('aria-pressed',String(on));});if(field)field.value=sample;if(role)role.value='student';if(action)action.value='manage';render();});",
      "render();",
      "})();"
    ].join("");
    var controlMarkup = v.id === "bac" ?
      '<div class="site-form"><label>Signed in as<select id="role"><option value="student">Student</option><option value="instructor">Instructor</option></select></label><label>Page action<select id="action"><option value="manage">Manage site settings</option><option value="read">Open public page</option></select></label></div>' :
      '<form id="input-form"><label for="sample">' + esc(config.label) + '</label><div class="site-input-row"><input id="sample" autocomplete="off" spellcheck="false" value="' + esc(config.sample) + '"><button type="submit">' + (v.id === "sqli" || v.id === "xss" ? "Search" : v.id === "idor" ? "Open record" : v.id === "traversal" ? "Open file" : "Check status") + '</button></div></form>';
    return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'; script-src \'unsafe-inline\'; form-action \'none\'; base-uri \'none\'"><title>' + esc(config.pageName) + '</title><style>' + miniSiteCss() + '</style></head><body><div class="site"><header class="site-top"><div class="site-brand"><span class="site-mark">C</span><div><span class="site-label">CAMPUSLINE / STUDENT PORTAL</span><strong>' + esc(config.pageName) + '</strong></div></div><span id="badge" class="site-status">READY</span></header><div class="site-browser"><span class="site-dots">● ● ●</span><span class="site-origin">campusline.local</span><code id="address">' + esc(config.pagePath) + '</code></div><nav class="site-nav"><span>DASHBOARD</span><span>COURSES</span><span>SUPPORT</span><span>PROFILE</span></nav><main><div class="site-heading"><span class="site-label">' + esc(v.name.toUpperCase()) + ' SCENARIO</span><h1>' + esc(config.pageName) + '</h1><p>' + esc(config.hint) + '</p></div><div class="site-policies"><div class="site-buttons"><button type="button" data-mode="vulnerable" class="selected" aria-pressed="true">Vulnerable</button><button type="button" data-mode="defended" aria-pressed="false">Defended</button><button type="button" id="reset" class="reset">Reset sample</button></div><span class="site-live">● Live page · edits update immediately</span></div><section class="site-content">' + controlMarkup + '<div id="result" aria-live="polite"></div></section></main><footer>CampusLine demonstration · synthetic data</footer></div><script>' + initialScript + '</script></body></html>';
  }

  function miniSiteCss() {
    return "*{box-sizing:border-box}body{margin:0;background:#e9edf5;color:#202945;font:13px/1.5 'Segoe UI',Arial,sans-serif}.site{min-height:100vh;background:#f5f7fb}.site-top{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:10px 15px;background:#20294a;color:#fff}.site-brand{display:flex;align-items:center;gap:9px}.site-mark{display:grid;place-items:center;width:28px;height:28px;border-radius:7px;background:#7182ed;color:#fff;font-weight:800}.site-top>div:last-child{display:grid;gap:2px}.site-top strong{font-size:14px}.site-top .site-label{color:#cbd2ff;font:8px Consolas,monospace;letter-spacing:.1em}.site-status{max-width:50%;padding:5px 8px;border:1px solid #667195;border-radius:5px;color:#eef1ff;font:8px Consolas,monospace;text-align:center}.site-status.exposed{border-color:#e6a18b;background:#612f39;color:#ffe8df}.site-status.blocked,.site-status.safe{border-color:#70b7ab;background:#174841;color:#d8fff3}.site-browser{display:flex;align-items:center;gap:9px;min-height:34px;padding:6px 12px;background:#e9edf5;border-bottom:1px solid #d7ddeb;color:#65708d;font:9px Consolas,monospace}.site-dots{color:#ea8d7b;white-space:nowrap}.site-origin{padding:4px 8px;border:1px solid #d2d9e8;border-radius:5px;background:#fff;color:#394665}.site-browser code{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.site-nav{display:flex;gap:18px;padding:9px 16px;border-bottom:1px solid #e0e5f0;background:#fff;color:#4b5674;font:9px Consolas,monospace}.site-nav span:last-child{margin-left:auto}main{max-width:840px;margin:auto;padding:15px}.site-heading .site-label{display:block;color:#6677dc}.site-heading h1{margin:3px 0;font-size:19px;line-height:1.2}.site-heading p{margin:0 0 9px;color:#68738b;font-size:10px}.site-policies{display:flex;justify-content:space-between;align-items:center;gap:9px;flex-wrap:wrap;margin:0 0 9px;padding:8px;border:1px solid #dfe4ef;border-radius:6px;background:#fff}.site-buttons{display:flex;gap:6px;flex-wrap:wrap}.site-buttons button,.site-input-row button{min-height:30px;padding:0 10px;border:1px solid #d5dced;border-radius:5px;background:#f8f9fd;color:#465273;font-size:10px;cursor:pointer}.site-buttons button.selected[data-mode=vulnerable]{border-color:#e1a190;background:#fff0eb;color:#9c452e}.site-buttons button.selected[data-mode=defended]{border-color:#7ebbb1;background:#e8f7f3;color:#22675b}.site-buttons .reset{background:transparent}.site-live{color:#77819a;font:8px Consolas,monospace}.site-content{padding:11px;border:1px solid #dfe4ef;border-radius:6px;background:#fff}form label,.site-form label{display:grid;gap:5px;margin-bottom:6px;color:#65708c;font:8px Consolas,monospace;letter-spacing:.04em;text-transform:uppercase}.site-input-row{display:flex;gap:7px}input,select{min-width:0;width:100%;min-height:34px;padding:7px 9px;border:1px solid #ccd4e5;border-radius:5px;background:#fff;color:#202945;font:11px Consolas,monospace}.input:focus,input:focus,select:focus{outline:2px solid #aab5ff;border-color:#6678dc}.site-input-row button{flex:0 0 auto;border-color:#4d61d3;background:#4d61d3;color:#fff}.site-form{display:grid;grid-template-columns:1fr 1fr;gap:8px}.site-notice,.site-card{margin-top:8px;padding:9px;border:1px solid #dfe4ef;border-radius:5px;background:#f8f9fc}.site-notice strong,.site-card h3{display:block;margin:0 0 3px;font-size:11px}.site-notice p,.site-card p{margin:0;color:#68738b;font-size:10px;white-space:pre-line;overflow-wrap:anywhere}.site-notice.exposed{border-color:#edcabe;border-left:3px solid #dd775b;background:#fff3ef}.site-notice.blocked,.site-notice.safe{border-color:#c2e3da;border-left:3px solid #45a594;background:#effaf6}.site-label{display:block;margin-bottom:4px}.site-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}.site-grid .site-card{margin-top:7px}.site-card{overflow-wrap:anywhere}.site-card h3{font-size:10px}.site-card.reflected{border-left:3px solid #dd775b}.site-alert{margin-top:8px;padding:9px;border:1px solid #edcabe;border-left:3px solid #dd775b;border-radius:5px;background:#fff7f4}.site-alert strong{font-size:10px}.site-alert p{margin:5px 0 0;font-size:11px}footer{padding:8px 15px;border-top:1px solid #e0e5f0;color:#7b859b;font:8px Consolas,monospace}@media(max-width:600px){main{padding:11px}.site-grid{grid-template-columns:1fr}.site-form{grid-template-columns:1fr}.site-policies{align-items:flex-start}.site-live{width:100%}.site-top{align-items:flex-start}.site-status{font-size:7px}}";
  }

  function customizeMiniSiteDocument(v) {
    var config = demoConfigs[v.id];
    var domain = config.brand.toLowerCase().replace(/[^a-z0-9]/g, "") + ".local";
    var navigation = config.navigation.split("·").map(function (item) { return "<span>" + esc(item.trim()) + "</span>"; }).join("");
    var themes = ".skin-shop .site-top{background:#202936}.skin-shop .site-mark,.skin-shop .site-input-row button{background:#efaa36;color:#202936;border-color:#efaa36}.skin-shop .site-top .site-label{color:#f4d598}.skin-shop .site-nav{background:#f4f6f8}.skin-social .site-top{background:#fff;color:#25344a;border-bottom:1px solid #e2e8f0}.skin-social .site-top .site-label{color:#71809a}.skin-social .site-mark{border-radius:50%;background:#4777cf}.skin-social .site-nav{background:#f0f5ff}.skin-social .site-input-row button{background:#4777cf;border-color:#4777cf}.skin-cloud .site-top{background:#fff;color:#26374a;border-bottom:1px solid #dce7ef}.skin-cloud .site-top .site-label{color:#55819d}.skin-cloud .site-mark{background:#1689bd}.skin-cloud .site-nav{background:#e9f5fb}.skin-cloud .site-input-row button{background:#1689bd;border-color:#1689bd}.skin-admin .site-top{background:#252a31}.skin-admin .site-mark,.skin-admin .site-input-row button{background:#537b61;border-color:#537b61}.skin-admin .site-nav{background:#f2f4f6}.skin-admin .site-status{border-color:#758279}.skin-forum .site-top{background:#3e5966}.skin-forum .site-mark{background:#df8d43}.skin-forum .site-nav{background:#fff8ef}.skin-forum .site-input-row button{background:#c96b32;border-color:#c96b32}.skin-host .site-top{background:#111d2b}.skin-host .site-top .site-label{color:#9bb6cd}.skin-host .site-mark{background:#1d9c9a}.skin-host .site-nav{background:#e9f5f5}.skin-host .site-input-row button{background:#168c8b;border-color:#168c8b}";
    return miniSiteDocument(v)
      .replace('<div class="site">', '<div class="site skin-' + esc(config.theme) + '">')
      .replace('<span class="site-mark">C</span>', '<span class="site-mark">' + esc(config.brand.charAt(0)) + '</span>')
      .replace("CAMPUSLINE / STUDENT PORTAL", esc(config.brand.toUpperCase()) + " / WEB APP")
      .replace(/campusline\.local/g, esc(domain))
      .replace('<nav class="site-nav"><span>DASHBOARD</span><span>COURSES</span><span>SUPPORT</span><span>PROFILE</span></nav>', '<nav class="site-nav">' + navigation + '</nav>')
      .replace("CampusLine demonstration · synthetic data", esc(config.brand) + " demonstration · fictional data")
      .replace("</style>", themes + "</style>");
  }

  function renderDemo(v) {
    var config = demoConfigs[v.id];
    return '<div class="embedded-monitor"><div class="embedded-monitor-label"><span class="demo-lamp"></span> EMBEDDED MINI WEBSITE <span>· ' + esc(v.name.toUpperCase()) + '</span></div><iframe class="mini-site-frame" title="' + esc(v.name + " hands-on practice website") + '" sandbox="allow-scripts" referrerpolicy="no-referrer" srcdoc="' + esc(customizeMiniSiteDocument(v)) + '"></iframe><p class="demo-safety">This mini website runs only inside its sandbox. No network request, database, real account, file access, or operating-system command is used.</p></div>';
  }

  function renderDemoLab() {
    return lessonHeader("Practice / Local scenarios", "Practice Bench", "Work through six small application scenarios. Edit a concrete sample and watch the practice app update immediately; switch server policy to compare.", "LAB") +
      '<div class="note neutral"><span>Every scenario runs as an in-page teaching model with synthetic records. The examples are concrete; no input is sent to a website, and no SQL, script, file access, or shell command is executed.</span></div>' +
      '<div class="section-head"><h2>Choose a scenario</h2><span class="minor">REQUEST → DECISION → RESPONSE</span></div>' +
      vulnerabilities.map(function (v, i) {
        return '<section class="demo-lab-section" id="demo-' + v.id + '"><div class="demo-lab-heading"><span class="course-index">SCENARIO 0' + (i + 1) + '</span><h2>' + esc(v.name) + '</h2><p>' + esc(v.one) + '</p></div>' + renderDemo(v) + '</section>';
      }).join("");
  }

  function renderVulnerability(v) {
    var index = vulnerabilities.indexOf(v) + 1;
    var flow = '<div class="flow">' + v.flow.map(function (step) {
      return '<article class="flow-step"><strong>' + esc(step[0]) + "</strong><p>" + esc(step[1]) + "</p></article>";
    }).join("") + "</div>";
    var prevention = '<div class="review-grid"><article><h3>Verify</h3>' + list(v.focus) + '</article><article><h3>Prevent</h3>' + list(v.fix) + '</article></div>';
    var surfaces = '<ul class="check-list">' + v.surfaces.map(function (item) { return '<li><strong>' + esc(item[0]) + '</strong> — ' + esc(item[1]) + '</li>'; }).join("") + '</ul>';
    var impacts = '<ul class="check-list">' + v.why.map(function (item) { return '<li>' + esc(item) + '</li>'; }).join("") + '</ul>';
    var misses = '<ul class="check-list mistake-list">' + v.misses.map(function (item) { return '<li>' + esc(item) + '</li>'; }).join("") + '</ul>';
    return lessonHeader("Web vulnerabilities / Lesson " + String(index).padStart(2, "0"), esc(v.name) + '<span class="impact ' + (v.impact === "Medium" ? "medium" : "") + '">' + esc(v.impact) + " impact</span>", v.one, String(index).padStart(2, "0")) +
      '<div class="lesson-layout lesson-single"><div class="lesson-main">' +
      lessonBlock("01", "The weakness", "<p>" + esc(v.what) + "</p>") +
      lessonBlock("02", "What happens in the app", flow) +
      lessonBlock("03", "Verify and prevent it", prevention) +
      infoDisclosure("More detail: where it appears", surfaces) +
      infoDisclosure("More detail: possible impact", impacts) +
      infoDisclosure("Common review misses", misses) +
      "</div></div>" +
      '<section class="lesson-demo-section" id="demo-window-' + v.id + '"><div class="lesson-demo-heading"><p class="eyebrow">HANDS-ON WEBSITE / ' + esc(v.name.toUpperCase()) + '</p></div>' + renderDemo(v) + '</section>' +
      lessonActions(index < vulnerabilities.length ? vulnerabilities[index].route : "compare");
  }

  function renderCompare() {
    return lessonHeader("Web security / Review", "Compare & review", "A compact map from each weakness to the boundary that fails and the defensive control that restores it.", "R1") +
      '<div class="data-table-wrap"><table><thead><tr><th>Weakness</th><th>Trust boundary</th><th>Primary control</th><th>Review question</th></tr></thead><tbody>' +
      [
        ["SQL Injection", "Input → database query", "Parameterized queries", "Does query structure stay fixed when a value changes?"],
        ["IDOR", "User → data object", "Per-object authorization", "Does the server check this user may access this record?"],
        ["Path Traversal", "Input → filesystem", "Canonical path containment", "Does the resolved path stay inside the approved directory?"],
        ["Broken Access Control", "Role → action", "Server-side permission checks", "Is every operation checked against an explicit permission?"],
        ["Reflected XSS", "Request → browser markup", "Context-aware output encoding", "Is output encoded for the context where it appears?"],
        ["Command Injection", "Input → operating-system process", "Structured process arguments", "Can input be interpreted as shell syntax?"]
      ].map(function (r) {
        return "<tr><td>" + r[0] + "</td><td>" + r[1] + "</td><td>" + r[2] + "</td><td>" + r[3] + "</td></tr>";
      }).join("") + "</tbody></table></div>" +
      '<div class="section-head"><h2>Which control addresses which problem?</h2><span class="minor">DESIGN PRINCIPLES</span></div>' +
      '<div class="grid two"><article class="card"><h3>Separate data from instructions</h3><p>Use parameters for database values, structured arguments for processes, and context-aware output encoding for browser content.</p></article><article class="card"><h3>Check identity and permission</h3><p>Authentication identifies the requester. Server-side authorization determines which objects and actions are allowed.</p></article><article class="card"><h3>Confine the resource</h3><p>Resolve file paths and prove they remain inside the intended directory. Limit the process’s access as a second layer.</p></article><article class="card"><h3>Fail closed and record</h3><p>Deny access when a permission rule is missing. Log useful security events without exposing sensitive values.</p></article></div>' +
      lessonBlock("01", "Review checklist", list(["Identify every trust boundary: user input, stored object, file path, process, or role.", "Find the control that runs on the server at the point of use.", "Check whether the control applies consistently across reads, changes, and alternate paths.", "Use synthetic data and explicit written permission for all hands-on assessment."])) +
      '<div class="lesson-actions"><button class="next-btn" type="button" data-go="quickref">Open quick reference&nbsp; →</button><button class="next-btn" type="button" data-go="web">Back to vulnerability lessons</button></div>';
  }

  function renderQuickRef() {
    var toolRows = [
      ["Nmap", "Host discovery", "nmap -sn <approved-scope>"],
      ["Nmap", "Service detection", "nmap -sV <approved-host>"],
      ["Nmap", "Verbose output", "nmap -v <approved-host>"],
      ["Nmap", "Operating system estimate", "nmap -O <approved-host>"],
      ["Wireshark", "DNS display filter", "dns"],
      ["Wireshark", "TCP display filter", "tcp"],
      ["Wireshark", "TCP port display filter", "tcp.port == 443"],
      ["Zenmap", "Inspect profile command", "Review the generated Nmap command before scanning"],
      ["Linux", "Current directory", "pwd"],
      ["Linux", "List files with details", "ls -la"],
      ["Linux", "Search a log", "grep -in \"error\" app.log"],
      ["Linux", "List listening sockets", "ss -tuln"],
      ["Linux", "List processes", "ps -ef"]
    ];
    return lessonHeader("Reference / At a glance", "Quick reference", "A concise lookup for the course terms, common analysis patterns, and the main defense for each web weakness.", "Q1") +
      '<div class="section-head"><h2>Web security controls</h2><span class="minor">CAUSE → CONTROL</span></div>' +
      '<div class="data-table-wrap"><table><thead><tr><th>Weakness</th><th>Root cause</th><th>First control</th></tr></thead><tbody>' +
      vulnerabilities.map(function (v) { return "<tr><td>" + esc(v.name) + "</td><td>" + esc(v.one) + "</td><td>" + esc(v.control) + "</td></tr>"; }).join("") +
      "</tbody></table></div>" +
      '<div class="section-head"><h2>Foundations lookup</h2><span class="minor">EXAMPLES USE APPROVED-SCOPE PLACEHOLDERS</span></div>' +
      '<div class="data-table-wrap"><table><thead><tr><th>Tool</th><th>Use</th><th>Example</th></tr></thead><tbody>' +
      toolRows.map(function (r) { return "<tr><td>" + r[0] + "</td><td>" + r[1] + '</td><td><code class="inline-code">' + esc(r[2]) + "</code></td></tr>"; }).join("") +
      "</tbody></table></div>" +
      '<div class="section-head"><h2>Network concepts</h2><span class="minor">KEEP THE VOCABULARY CLOSE</span></div>' +
      '<div class="grid two">' + networkTerms.slice(0, 8).map(function (term) {
        return '<article class="card"><h3>' + esc(term[0]) + "</h3><p>" + esc(term[1]) + "</p><p><strong>In practice.</strong> " + esc(term[2]) + "</p></article>";
      }).join("") + "</div>" +
      '<div class="grid two">' + [["net-addressing", "Full chapter: addresses & subnets"], ["net-routing", "Full chapter: routing & gateways"], ["net-services", "Full chapter: DNS, ports & protocols"], ["net-troubleshooting", "Full chapter: troubleshooting"]].map(function (item) { return '<button class="next-btn" type="button" data-go="' + item[0] + '">' + item[1] + ' ↗</button>'; }).join("") + "</div>" +
      '<div class="note"><span>Use written authorization for active testing. Keep production data and credentials out of practice material.</span></div>';
  }

  var pages = {
    overview: renderOverview, net: renderNetwork, nmap: renderNmap, zen: renderZenmap,
    ws: renderWireshark, linux: renderLinux, web: renderWebOverview, "demo-lab": renderDemoLab,
    "net-addressing": renderNetworkAddressing, "net-routing": renderNetworkRouting,
    "net-services": renderNetworkServices, "net-troubleshooting": renderNetworkTroubleshooting,
    compare: renderCompare, quickref: renderQuickRef
  };
  vulnerabilities.forEach(function (v) {
    pages[v.route] = function () { return renderVulnerability(v); };
  });

  var main = document.getElementById("main");
  var nav = document.getElementById("course-nav");
  var search = document.getElementById("course-search");
  var searchResults = document.getElementById("search-results");
  var crumb = document.getElementById("current-crumb");
  var menuToggle = document.getElementById("menu-toggle");

  function renderNav(active) {
    nav.innerHTML = navGroups.map(function (group) {
      return '<div class="nav-group"><p class="group-label">' + group.label + "</p>" + group.items.map(function (item) {
        return '<button class="nav-item ' + (item.id === active ? "active" : "") + '" type="button" data-go="' + item.id + '" aria-current="' + (item.id === active ? "page" : "false") + '">' +
          '<span class="nav-glyph">' + item.glyph + "</span><span>" + item.label + "</span></button>";
      }).join("") + "</div>";
    }).join("");
  }
  function crumbText(id) {
    for (var i = 0; i < navGroups.length; i++) {
      for (var j = 0; j < navGroups[i].items.length; j++) {
        if (navGroups[i].items[j].id === id) return navGroups[i].items[j].label.toUpperCase();
      }
    }
    return "FIELD GUIDE";
  }
  function closeMenu() {
    document.body.classList.remove("menu-open");
    document.getElementById("sidebar").classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open course menu");
  }
  function go(id) {
    if (!pages[id]) id = "overview";
    closeMenu();
    main.innerHTML = pages[id]();
    main.querySelectorAll(".demo-shell").forEach(simulateDemo);
    main.focus({ preventScroll: true });
    window.scrollTo(0, 0);
    crumb.textContent = crumbText(id);
    renderNav(id);
    try { history.replaceState(null, "", "#" + id); } catch (e) {}
  }
  function findLabel(id) {
    for (var i = 0; i < navGroups.length; i++) {
      for (var j = 0; j < navGroups[i].items.length; j++) {
        if (navGroups[i].items[j].id === id) return navGroups[i].items[j].label;
      }
    }
    return id;
  }
  function buildSearchIndex() {
    var index = [];
    networkTerms.forEach(function (x) { index.push({ title: x[0], section: "net", text: (x.join(" ") + " networking").toLowerCase() }); });
    nmapLessons.forEach(function (x) { index.push({ title: x.title, section: "nmap", text: (x.title + " " + x.purpose + " " + x.observe).toLowerCase() }); });
    linuxGroups.forEach(function (g) {
      g.rows.forEach(function (r) { index.push({ title: r[0] + " — " + r[1], section: "linux", text: (g.title + " " + r.join(" ")).toLowerCase() }); });
    });
    vulnerabilities.forEach(function (v) {
      index.push({ title: v.name, section: v.route, text: (v.name + " " + v.one + " " + v.what + " " + v.surfaces.map(function (x) { return x.join(" "); }).join(" ") + " " + v.control).toLowerCase() });
    });
    [
      ["Networking basics", "net", "IP address ports TCP UDP DNS DHCP subnet router gateway"],
      ["Addresses and subnets", "net-addressing", "IPv4 IPv6 CIDR prefix subnet MAC private public address"],
      ["Routing and gateways", "net-routing", "routing table default gateway next hop NAT neighbor route"],
      ["DNS ports and protocols", "net-services", "DNS DHCP TCP UDP HTTP HTTPS TLS port service"],
      ["Network troubleshooting", "net-troubleshooting", "interface route gateway DNS reachability diagnostics"],
      ["Nmap", "nmap", "host discovery port scan service version detection"],
      ["Zenmap", "zen", "graphical interface profiles target command output"],
      ["Wireshark", "ws", "packet capture filters protocol analysis"],
      ["Linux essentials", "linux", "terminal shell files permissions search"],
      ["Web vulnerabilities", "web", "web security modules injection authorization"],
      ["Practice Bench", "demo-lab", "sample payload simulation synthetic data vulnerable defended request response trace"],
      ["Compare and review", "compare", "defense matrix controls"],
      ["Quick reference", "quickref", "lookup cheat sheet"]
    ].forEach(function (x) { index.push({ title: x[0], section: x[1], text: x[2] }); });
    return index;
  }
  var searchIndex = buildSearchIndex();

  document.addEventListener("click", function (event) {
    var scrollButton = event.target.closest("[data-scroll-to]");
    if (scrollButton) {
      var destination = document.getElementById(scrollButton.getAttribute("data-scroll-to"));
      if (destination) {
        document.documentElement.style.scrollBehavior = "auto";
        window.scrollTo(0, window.scrollY + destination.getBoundingClientRect().top - 18);
      }
      return;
    }
    var goButton = event.target.closest("[data-go]");
    if (goButton) {
      go(goButton.getAttribute("data-go"));
      search.value = "";
      searchResults.classList.remove("open");
      return;
    }
    var tabButton = event.target.closest("[data-tab]");
    if (tabButton) {
      var tabsWrap = tabButton.closest(".lesson-block");
      var selected = tabButton.getAttribute("data-tab");
      tabsWrap.querySelectorAll("[data-tab]").forEach(function (button) {
        button.setAttribute("aria-selected", button === tabButton ? "true" : "false");
      });
      tabsWrap.querySelectorAll(".tab-panel").forEach(function (panel) {
        panel.classList.toggle("active", panel.getAttribute("data-panel") === selected);
      });
      return;
    }
    var dismissAlert = event.target.closest("[data-sim-alert-dismiss]");
    if (dismissAlert) {
      var alertOverlay = dismissAlert.closest(".sim-alert-overlay");
      if (alertOverlay) alertOverlay.remove();
      return;
    }
    var modeButton = event.target.closest("[data-demo-mode]");
    if (modeButton) {
      var demoShell = modeButton.closest(".demo-shell");
      var selectedMode = modeButton.getAttribute("data-demo-mode");
      demoShell.setAttribute("data-mode", selectedMode);
      demoShell.querySelectorAll("[data-demo-mode]").forEach(function (button) {
        var selected = button === modeButton;
        button.classList.toggle("active", selected);
        button.setAttribute("aria-pressed", String(selected));
      });
      simulateDemo(demoShell);
      return;
    }
    var resetDemoButton = event.target.closest("[data-demo-reset]");
    if (resetDemoButton) {
      var resetShell = resetDemoButton.closest(".demo-shell");
      resetShell.querySelectorAll("[data-demo-input]").forEach(function (field) { field.value = field.defaultValue; });
      resetShell.querySelectorAll("select").forEach(function (field) { field.selectedIndex = 0; });
      resetShell.setAttribute("data-mode", "unsafe");
      resetShell.querySelectorAll("[data-demo-mode]").forEach(function (button) {
        var selected = button.getAttribute("data-demo-mode") === "unsafe";
        button.classList.toggle("active", selected);
        button.setAttribute("aria-pressed", String(selected));
      });
      simulateDemo(resetShell);
      return;
    }
    var copyButton = event.target.closest(".copy-btn");
    if (copyButton) {
      var code = copyButton.closest(".code-card").querySelector("pre").innerText;
      copyText(code).then(function () {
        copyButton.textContent = "Copied";
        window.setTimeout(function () { copyButton.textContent = "Copy"; }, 1200);
      });
      return;
    }
    if (event.target === document.body && document.body.classList.contains("menu-open")) closeMenu();
    if (!event.target.closest(".search-wrap")) searchResults.classList.remove("open");
  });

  document.addEventListener("input", function (event) {
    var appField = event.target.closest("[data-app-live-input]");
    if (appField) {
      var appShell = appField.closest(".demo-shell");
      var linkedField = appShell && appShell.querySelector("[data-demo-input]");
      if (linkedField) linkedField.value = appField.value;
      if (appShell) simulateDemo(appShell, { focusAppInput: true, selectionStart: appField.selectionStart, selectionEnd: appField.selectionEnd });
      return;
    }
    var field = event.target.closest("[data-demo-input]");
    if (field) simulateDemo(field.closest(".demo-shell"));
  });
  document.addEventListener("submit", function (event) {
    var form = event.target.closest("[data-app-search-form]");
    if (!form) return;
    event.preventDefault();
    var shell = form.closest(".demo-shell");
    var appField = form.querySelector("[data-app-live-input]");
    var linkedField = shell && shell.querySelector("[data-demo-input]");
    if (appField && linkedField) linkedField.value = appField.value;
    if (shell) simulateDemo(shell);
  });
  document.addEventListener("change", function (event) {
    var field = event.target.closest("[data-demo-role], [data-demo-action]");
    if (field) simulateDemo(field.closest(".demo-shell"));
  });

  function copyText(value) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(value).catch(function () { return fallbackCopy(value); });
    return Promise.resolve(fallbackCopy(value));
  }
  function fallbackCopy(value) {
    var field = document.createElement("textarea");
    field.value = value;
    field.style.position = "fixed";
    field.style.opacity = "0";
    document.body.appendChild(field);
    field.select();
    try { document.execCommand("copy"); } catch (e) {}
    field.remove();
  }
  function uiNode(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
  }
  function uiAppend(parent, tag, className, text) {
    var node = uiNode(tag, className, text);
    parent.appendChild(node);
    return node;
  }
  function appHeading(parent, eyebrow, title, subtitle) {
    uiAppend(parent, "p", "app-eyebrow", eyebrow);
    uiAppend(parent, "h3", "app-title", title);
    if (subtitle) uiAppend(parent, "p", "app-subtitle", subtitle);
  }
  function appNotice(parent, type, title, detail) {
    var notice = uiAppend(parent, "div", "app-notice " + type);
    uiAppend(notice, "strong", "", title);
    uiAppend(notice, "span", "", detail);
    return notice;
  }
  function appCard(parent, title, detail, meta) {
    var card = uiAppend(parent, "article", "app-card");
    if (meta) uiAppend(card, "span", "app-card-meta", meta);
    uiAppend(card, "h4", "", title);
    uiAppend(card, "p", "", detail);
    return card;
  }
  function appSearchForm(parent, value, fieldTitle) {
    var form = uiAppend(parent, "form", "app-searchbar");
    form.setAttribute("data-app-search-form", "true");
    form.setAttribute("role", "search");
    uiAppend(form, "span", "app-live-field-title", fieldTitle || "Search term · type here");
    var row = uiAppend(form, "div", "app-search-row");
    uiAppend(row, "span", "app-search-icon", "⌕");
    var field = uiAppend(row, "input", "app-search-value");
    field.type = "text";
    field.value = value;
    field.defaultValue = shellSample(form);
    field.autocomplete = "off";
    field.setAttribute("aria-label", fieldTitle || "Search term · type here");
    field.setAttribute("data-app-live-input", "true");
    field.setAttribute("data-demo-input", "true");
    var button = uiAppend(row, "button", "app-search-button", "Search");
    button.type = "submit";
    return form;
  }
  function shellSample(node) {
    var shell = node.closest(".demo-shell");
    return shell ? shell.getAttribute("data-demo-sample") || "" : "";
  }
  function appLiveInput(parent, label, value, className) {
    var field = uiAppend(parent, "input", className || "app-inline-input");
    field.type = "text";
    field.value = value;
    field.defaultValue = shellSample(parent);
    field.autocomplete = "off";
    field.spellcheck = false;
    field.setAttribute("aria-label", label);
    field.setAttribute("data-app-live-input", "true");
    field.setAttribute("data-demo-input", "true");
    return field;
  }
  function appLiveSelect(parent, label, attribute, choices, selectedValue) {
    var labelNode = uiAppend(parent, "label", "app-setting-row app-live-select");
    uiAppend(labelNode, "span", "", label);
    var select = uiAppend(labelNode, "select", "app-inline-select");
    select.setAttribute(attribute, "true");
    select.setAttribute("aria-label", label);
    choices.forEach(function (choice) {
      var option = uiAppend(select, "option", "", choice[1]);
      option.value = choice[0];
      option.selected = choice[0] === selectedValue;
    });
    return select;
  }
  function renderSimulatedApp(shell, id, value, result, unsafe) {
    var root = shell.querySelector("[data-sim-app]");
    root.replaceChildren();
    var page = uiAppend(root, "div", "app-page app-page-" + id);

    if (id === "sqli") {
      appHeading(page, "LEARNING LIBRARY", "Course catalog", "Find a course in the Forge & Fracture training library.");
      if (result.state === "exposed") {
        appNotice(page, "notice-error", "Unexpected catalog response", "The sample changed the vulnerable query filter; all three synthetic courses were returned.");
      } else if (result.state === "allowed") {
        appNotice(page, "notice-success", "Search value treated as data", "The parameterized query kept its structure; no course title matched the complete sample.");
      } else {
        appNotice(page, "notice-neutral", "No injection pattern matched", "Try the preloaded tautology sample to compare the two policies.");
      }
      appSearchForm(page, value, "Course title · enter a sample here");
      if (result.state === "exposed") {
        uiAppend(page, "p", "app-result-count", "3 courses");
        var cards = uiAppend(page, "div", "app-course-grid");
        appCard(cards, "Forge Basics", "An introduction to materials, tools, and shop workflow.", "FOUNDATIONS · 3 LESSONS");
        appCard(cards, "Welding Safety", "Protective equipment, ventilation, and safe work habits.", "SAFETY · 5 LESSONS");
        appCard(cards, "Inspection Notes", "A practical guide to visual checks and documentation.", "QUALITY · 2 LESSONS");
      } else {
        uiAppend(page, "p", "app-result-count", "0 courses");
        appNotice(page, "notice-neutral", "No courses found", "No course title matches the complete search value.");
      }
    } else if (id === "idor") {
      appHeading(page, "LEARNER SPACE / RECORDS", "Private learning record", "A learner can view their own saved records.");
      var recordSearch = uiAppend(page, "div", "app-live-entry");
      uiAppend(recordSearch, "span", "app-live-field-title", "Record ID · edit the sample here");
      appLiveInput(recordSearch, "Record ID · edit the sample here", value);
      if (result.state === "exposed" || result.state === "allowed") {
        var recordId = value.trim();
        var owner = recordId === "record-102" ? "Student B" : "Student A";
        var detail = recordId === "record-102" ? "Instructor review — sample only" : "My draft lesson plan";
        var profile = uiAppend(page, "div", "app-record");
        uiAppend(profile, "div", "app-avatar", owner.slice(-1));
        var recordBody = uiAppend(profile, "div", "");
        uiAppend(recordBody, "span", "app-card-meta", recordId + " · PRIVATE RECORD");
        uiAppend(recordBody, "h4", "", owner);
        uiAppend(recordBody, "p", "", detail);
        uiAppend(profile, "span", "app-record-owner", "OWNER");
      } else {
        appNotice(page, "notice-error", result.statusCode === 404 ? "Record not found" : "Access denied", result.statusCode === 404 ? "This record does not exist in the practice dataset." : "Your account is not allowed to view this learner record.");
        uiAppend(page, "span", "app-inline-link", "← Return to my records");
      }
    } else if (id === "traversal") {
      appHeading(page, "COURSE MATERIALS", "Lesson file viewer", "Files are served from the public lesson library.");
      var fileSearch = uiAppend(page, "div", "app-live-entry");
      uiAppend(fileSearch, "span", "app-live-field-title", "File name · edit the sample here");
      appLiveInput(fileSearch, "File name · edit the sample here", value);
      uiAppend(page, "div", "app-breadcrumb", "Library   /   Lessons   /   " + (value.split(/[\\/]+/).pop() || "lesson.txt"));
      if (result.state === "exposed") {
        uiAppend(page, "span", "app-file-tag private", "PRIVATE NOTE · OUTSIDE PUBLIC AREA");
        var privateDoc = uiAppend(page, "article", "app-document");
        uiAppend(privateDoc, "h4", "", "Instructor review notes");
        uiAppend(privateDoc, "p", "", "Review the lesson before class. Add the safety briefing and discussion questions.");
        uiAppend(privateDoc, "small", "", "Synthetic document returned by the vulnerable path model.");
      } else if (result.state === "allowed") {
        uiAppend(page, "span", "app-file-tag", "PUBLIC LESSON");
        var publicDoc = uiAppend(page, "article", "app-document");
        uiAppend(publicDoc, "h4", "", "Welcome to the public lesson");
        uiAppend(publicDoc, "p", "", "This sample file lives inside the permitted lesson library.");
        uiAppend(publicDoc, "small", "", "lesson.txt · 1 minute read");
      } else {
        appNotice(page, "notice-error", result.statusCode === 404 ? "File not found" : "Path rejected", result.statusCode === 404 ? "The requested name is not in the public lesson library." : "The resolved path falls outside the public lesson directory.");
      }
    } else if (id === "bac") {
      appHeading(page, "COURSE ADMINISTRATION", "Course settings", "Manage enrollment and course visibility.");
      var settings = uiAppend(page, "div", "app-settings-card");
      uiAppend(settings, "label", "app-setting-row", "Course name     Forge Basics");
      uiAppend(settings, "label", "app-setting-row", "Enrollment       Open");
      uiAppend(settings, "label", "app-setting-row", "Visibility          Listed");
      appLiveSelect(settings, "Test role", "data-demo-role", [["student", "Student"], ["instructor", "Instructor"]], shell.getAttribute("data-selected-role") || "student");
      appLiveSelect(settings, "Requested action", "data-demo-action", [["manage", "Manage settings"], ["read", "Read public lesson"]], shell.getAttribute("data-selected-action") || "manage");
      uiAppend(settings, "button", "app-primary-button", "Save settings");
      if (result.state === "exposed" || result.state === "allowed") appNotice(page, "notice-success", "Settings saved", "The simulated settings action returned successfully.");
      else appNotice(page, "notice-error", "Permission required", "Your Student role cannot manage course settings.");
    } else if (id === "xss") {
      appHeading(page, "LEARNING LIBRARY", "Search", "Search course titles and lesson descriptions.");
      appSearchForm(page, value, "Search term · enter a sample here");
      var xssResult = uiAppend(page, "article", "app-search-result");
      uiAppend(xssResult, "span", "app-card-meta", "SEARCH RESULT");
      uiAppend(xssResult, "h4", "", "Results for: " + (value || "(empty search)"));
      uiAppend(xssResult, "p", "", "No matching course was found.");
      if (unsafe && result.state === "exposed") {
        var alertMatch = value.match(/<script\b[^>]*>[\s\S]*?alert\s*\(\s*(['"])(.*?)\1\s*\)[\s\S]*?<\/script\s*>/i);
        if (alertMatch) {
          var modal = uiAppend(root, "div", "sim-alert-overlay");
          var alertBox = uiAppend(modal, "div", "sim-alert");
          uiAppend(alertBox, "strong", "", "forgefracture.test says");
          uiAppend(alertBox, "p", "", alertMatch[2]);
          var dismiss = uiAppend(alertBox, "button", "app-primary-button", "OK");
          dismiss.type = "button";
          dismiss.setAttribute("data-sim-alert-dismiss", "true");
          uiAppend(alertBox, "small", "", "Browser alert effect · simulated, not executed");
        }
      }
    } else if (id === "cmdi") {
      appHeading(page, "SYSTEM TOOLS", "Service status", "Check whether the training lookup service is available.");
      var utility = uiAppend(page, "div", "app-utility-card");
      uiAppend(utility, "span", "app-card-meta", "LOOKUP UTILITY");
      var commandEntry = uiAppend(utility, "div", "app-live-entry");
      uiAppend(commandEntry, "span", "app-live-field-title", "Utility argument · enter a sample here");
      appLiveInput(commandEntry, "Utility argument · enter a sample here", value, "app-inline-input app-command-input");
      if (result.state === "exposed") {
        appNotice(utility, "notice-success", "Utility output", "Synthetic response from the vulnerable command-string model.");
        var terminal = uiAppend(utility, "pre", "app-terminal");
        terminal.textContent = "service status: training-online\nprocess identity: app-user";
      } else if (result.state === "blocked") {
        appNotice(utility, "notice-error", "Request rejected", "The argument contains a command separator. No process was started.");
      } else {
        appNotice(utility, "notice-success", "Service available", "The argument was treated as one literal value.");
        uiAppend(utility, "pre", "app-terminal", "service status: training-online");
      }
    }
  }
  function makeRawRequest(id, value, shell) {
    var method = "GET";
    var path = "/practice";
    var body = "";
    var headers = ["Host: forgefracture.test", "User-Agent: ForgeFracture-Practice/1.0", "Accept: text/html, application/json", "X-Practice-Role: Student A"];
    if (id === "sqli") path = "/practice/catalog?term=" + encodeURIComponent(value);
    if (id === "idor") path = "/practice/records/" + encodeURIComponent(value.trim());
    if (id === "traversal") path = "/practice/lesson?file=" + encodeURIComponent(value);
    if (id === "xss") path = "/practice/search?q=" + encodeURIComponent(value);
    if (id === "bac") {
      method = "POST"; path = "/practice/course/settings";
      var role = shell.getAttribute("data-selected-role") || "student";
      var action = shell.getAttribute("data-selected-action") || "manage";
      headers[3] = "X-Practice-Role: " + (role === "student" ? "Student" : "Instructor");
      headers.push("Content-Type: application/json");
      body = JSON.stringify({ action: action === "manage" ? "manage-settings" : "read-public-lesson" });
    }
    if (id === "cmdi") {
      method = "POST"; path = "/practice/lookup";
      headers.push("Content-Type: application/json");
      body = JSON.stringify({ argument: value });
    }
    return method + " " + path + " HTTP/1.1\n" + headers.join("\n") + (body ? "\nContent-Length: " + new TextEncoder().encode(body).length + "\n\n" + body : "\n\n");
  }
  function responseBody(id, value, result) {
    var safeValue = esc(value);
    if (id === "sqli") {
      var rows = result.state === "exposed" ? ["Forge Basics", "Welding Safety", "Inspection Notes"] : [];
      return "<!doctype html>\n<html><body><main><h1>Course catalog</h1><form><input name=\"term\" value=\"" + safeValue + "\"></form><p>" + rows.length + " courses</p><ul>" + rows.map(function (name) { return "<li>" + esc(name) + "</li>"; }).join("") + "</ul></main></body></html>";
    }
    if (id === "idor") {
      if (result.state === "exposed" || result.state === "allowed") return JSON.stringify({ id: value.trim(), owner: value.trim() === "record-102" ? "Student B" : "Student A", note: value.trim() === "record-102" ? "Instructor review — sample only" : "My draft lesson plan" }, null, 2);
      return JSON.stringify({ error: result.statusCode === 404 ? "record_not_found" : "forbidden", message: result.statusCode === 404 ? "No such record" : "You cannot access this record" }, null, 2);
    }
    if (id === "traversal") {
      var documentText = result.state === "exposed" ? "Instructor review notes" : "Welcome to the public lesson";
      var text = result.state === "exposed" ? "Review the lesson before class. Add the safety briefing and discussion questions." : "This sample file lives inside the permitted lesson library.";
      if (result.state === "blocked") return "<!doctype html>\n<html><body><main><h1>" + (result.statusCode === 404 ? "File not found" : "Path rejected") + "</h1><p>The requested file is unavailable.</p></main></body></html>";
      return "<!doctype html>\n<html><body><main><article><h1>" + documentText + "</h1><p>" + text + "</p></article></main></body></html>";
    }
    if (id === "bac") {
      if (result.state === "blocked") return JSON.stringify({ error: "permission_required", required: "manage-course" }, null, 2);
      return JSON.stringify({ ok: true, message: "Course settings saved" }, null, 2);
    }
    if (id === "xss") {
      var reflected = result.state === "exposed" ? value : safeValue;
      return "<!doctype html>\n<html><body><main><h1>Search</h1><form><input name=\"q\" value=\"" + (result.state === "exposed" ? value.replace(/"/g, "&quot;") : safeValue) + "\"></form><section><h2>Results for: " + reflected + "</h2><p>No matching course was found.</p></section></main></body></html>";
    }
    if (id === "cmdi") {
      if (result.state === "blocked") return JSON.stringify({ error: "invalid_argument", message: "Command separator is not allowed" }, null, 2);
      if (result.state === "exposed") return JSON.stringify({ status: "training-online", identity: "app-user" }, null, 2);
      return JSON.stringify({ status: "training-online" }, null, 2);
    }
    return "";
  }
  function makeRawResponse(id, value, result) {
    var reason = { 200: "OK", 400: "Bad Request", 403: "Forbidden", 404: "Not Found" }[result.statusCode] || "OK";
    var type = ["idor", "bac", "cmdi"].indexOf(id) >= 0 ? "application/json" : "text/html; charset=utf-8";
    var body = responseBody(id, value, result);
    var headers = ["Content-Type: " + type, "Cache-Control: no-store", "X-Content-Type-Options: nosniff", "Content-Length: " + new TextEncoder().encode(body).length];
    if (id === "xss" && !result.unsafe) headers.push("Content-Security-Policy: default-src 'none'; style-src 'self'; form-action 'self'");
    return "HTTP/1.1 " + result.statusCode + " " + reason + "\n" + headers.join("\n") + "\n\n" + body;
  }
  function simulateDemo(shell, focusOptions) {
    var id = shell.getAttribute("data-demo-id");
    var unsafe = shell.getAttribute("data-mode") === "unsafe";
    var input = shell.querySelector("[data-demo-input]") || shell.querySelector("[data-app-live-input]");
    var value = input ? input.value : shell.getAttribute("data-demo-sample") || "";
    var roleControl = shell.querySelector("[data-demo-role]");
    var actionControl = shell.querySelector("[data-demo-action]");
    var selectedRole = roleControl ? roleControl.value : shell.getAttribute("data-selected-role") || "student";
    var selectedAction = actionControl ? actionControl.value : shell.getAttribute("data-selected-action") || "manage";
    shell.setAttribute("data-selected-role", selectedRole);
    shell.setAttribute("data-selected-action", selectedAction);
    var result = { state: "neutral", status: "SIMULATED RESPONSE", statusCode: 200, request: "", decision: "", response: "", trace: [], unsafe: unsafe };
    if (id === "sqli") {
      var tautology = /\bOR\s+['"]?1['"]?\s*=\s*['"]?1['"]?/i.test(value);
      result.request = "GET /practice/catalog?term=" + encodeURIComponent(value);
      if (unsafe && tautology) {
        result.state = "exposed"; result.status = "QUERY LOGIC CHANGED";
        result.decision = "The toy string-built query treats the OR condition as SQL syntax. The WHERE condition becomes true for the sample catalog.";
        result.response = "200 OK · synthetic catalog\nForge Basics — 3 lessons\nWelding Safety — 5 lessons\nInspection Notes — 2 lessons";
        result.trace = ["The request carries the sample in a catalog search parameter.", "The vulnerable model joins that value into query text.", "The tautology changes the filter condition.", "Three synthetic rows are returned; no database is queried."];
      } else if (unsafe) {
        result.state = "neutral"; result.status = "NO PATTERN MATCH";
        result.decision = "This teaching model only recognizes the loaded tautology example; it is not a SQL parser.";
        result.response = "200 OK · no synthetic catalog rows match this sample";
        result.trace = ["The request reaches the toy catalog model.", "The small teaching recognizer did not match the demonstration pattern.", "This result does not establish that arbitrary SQL input is safe."];
      } else {
        result.state = "allowed"; result.status = "PARAMETERIZED QUERY";
        result.decision = "The query shape stays fixed and the submitted text is bound as one parameter value.";
        result.response = "200 OK · 0 matching catalog rows\nparameter[1] = " + value;
        result.trace = ["The request carries a search value.", "The defended model uses a fixed query with a parameter marker.", "The sample is data, so its OR text cannot change query structure.", "No catalog title matches the complete sample value."];
      }
    } else if (id === "idor") {
      var record = value.trim();
      result.request = "GET /practice/records/" + record + "\nSigned in as: Student A";
      if (record === "record-101") {
        result.state = "allowed"; result.status = "OWNER ACCESS";
        result.decision = "Student A owns this synthetic record, so both policies allow it.";
        result.response = "200 OK\nrecord-101\nowner: Student A\nnote: My draft lesson plan";
        result.trace = ["Student A requests record-101.", "The model finds that the current learner owns the record.", "The request is allowed and returns Student A’s synthetic note."];
      } else if (record === "record-102" && unsafe) {
        result.state = "exposed"; result.status = "OTHER USER DATA EXPOSED";
        result.decision = "The vulnerable model checks that Student A is signed in but does not check ownership of record-102.";
        result.response = "200 OK\nrecord-102\nowner: Student B\nnote: Instructor review — sample only";
        result.trace = ["Student A changes the object identifier to record-102.", "The toy route finds Student B’s synthetic record.", "No per-object authorization check runs.", "The other learner’s sample note is returned."];
      } else if (record === "record-102") {
        result.state = "blocked"; result.status = "OWNER CHECK DENIED";
        result.decision = "The owner check compares Student A with Student B and denies access.";
        result.response = "403 Forbidden\n{ \"error\": \"You cannot access this record.\" }";
        result.trace = ["Student A requests record-102.", "The server-side model loads the owner identity.", "Student A is not the owner, so the request is denied before returning the record."];
      } else {
        result.state = "neutral"; result.status = "NOT FOUND";
        result.decision = "The requested identifier does not match either synthetic record.";
        result.response = "404 Not Found\nNo sample record exists for this identifier.";
        result.trace = ["The request contains an unknown record identifier.", "The synthetic record set has no matching item.", "The model returns not found."];
      }
    } else if (id === "traversal") {
      var escapesFolder = value.split(/[\\/]+/).some(function (part) { return part === ".."; });
      result.request = "GET /practice/lesson?file=" + encodeURIComponent(value);
      if (escapesFolder && unsafe) {
        result.state = "exposed"; result.status = "PATH ESCAPED FOLDER";
        result.decision = "The vulnerable model appends the supplied path without proving the normalized result remains under /public.";
        result.response = "200 OK · synthetic private note\nInstructor-only sample text: review the lesson before class.";
        result.trace = ["The request supplies a file selector.", "The vulnerable model joins it to the public lesson folder.", "A parent-directory segment moves the resolved location outside that folder.", "Only a hard-coded synthetic note is returned; no device file is read."];
      } else if (escapesFolder) {
        result.state = "blocked"; result.status = "PATH CONTAINMENT DENIED";
        result.decision = "The defended model rejects a normalized path that would leave the approved public folder.";
        result.response = "403 Forbidden\nThe requested file is outside the public lesson area.";
        result.trace = ["The request supplies a file selector.", "The server model normalizes the path before looking up a file.", "The resolved location is outside the allowed directory.", "The request is denied; no file is opened."];
      } else if (value.trim() === "lesson.txt") {
        result.state = "allowed"; result.status = "PUBLIC SAMPLE";
        result.decision = "The normalized path remains inside the public lesson area.";
        result.response = "200 OK · synthetic public lesson\nWelcome to the public lesson.";
        result.trace = ["The request asks for lesson.txt.", "The normalized path stays within the public directory.", "The in-memory sample map returns the public lesson."];
      } else {
        result.state = "neutral"; result.status = "NOT FOUND";
        result.decision = "No matching entry exists in the tiny synthetic file map.";
        result.response = "404 Not Found\nNo sample lesson matches this name.";
        result.trace = ["The request supplies a file selector.", "The model checks its in-memory public sample map.", "No matching sample entry is found."];
      }
    } else if (id === "bac") {
      var role = selectedRole;
      var action = selectedAction;
      var roleName = role === "student" ? "Student" : "Instructor";
      result.request = "POST /practice/course/settings\nSigned-in role: " + roleName + "\nAction: " + (action === "manage" ? "manage settings" : "read public lesson");
      if (action === "read") {
        result.state = "allowed"; result.status = "PUBLIC ACTION ALLOWED";
        result.decision = "The public lesson is readable by both simulated roles.";
        result.response = "200 OK\nLesson: Course introduction";
        result.trace = ["The request asks to read a public lesson.", "The model checks the public-read rule.", "The action is allowed for Student and Instructor."];
      } else if (unsafe) {
        result.state = "exposed"; result.status = "RESTRICTED ACTION ALLOWED";
        result.decision = "The vulnerable model checks only for a signed-in session; it does not verify the manage-course permission.";
        result.response = "200 OK\nCourse settings changed (simulated)\nNo course data was changed.";
        result.trace = ["The request asks to manage course settings.", roleName + " has a signed-in session.", "The vulnerable policy mistakes authentication for authorization.", "The model reports success without changing any real course data."];
      } else if (role === "instructor") {
        result.state = "allowed"; result.status = "PERMISSION GRANTED";
        result.decision = "The defended policy confirms the Instructor role has the manage-course permission.";
        result.response = "200 OK\nCourse settings saved (simulated)\nNo course data was changed.";
        result.trace = ["The request asks to manage course settings.", "The server checks the role’s explicit permission.", "Instructor has permission, so the action is allowed."];
      } else {
        result.state = "blocked"; result.status = "PERMISSION DENIED";
        result.decision = "The defended policy checks the requested action against Student A’s permissions and denies it.";
        result.response = "403 Forbidden\n{ \"error\": \"Permission required: manage-course\" }";
        result.trace = ["The request asks to manage course settings.", "The server checks an explicit permission for this action.", "Student does not have manage-course permission.", "The request is denied before any change is made."];
      }
    } else if (id === "xss") {
      var containsMarkup = /<[^>]+>/.test(value);
      result.request = "GET /practice/search?q=" + encodeURIComponent(value);
      if (containsMarkup && unsafe) {
        result.state = "exposed"; result.status = "UNSAFE REFLECTION SIMULATED";
        result.decision = "An unsafe template would place the search value into an HTML context without encoding. This simulator displays the browser effect as text only.";
        result.response = "200 OK · hypothetical HTML response\n<div class=\"result\">" + value + "</div>\n\nNo markup is inserted and no script executes here.";
        result.trace = ["The request includes the concrete script-tag sample.", "The vulnerable model reflects the value into an HTML body without encoding.", "A browser could interpret the tag as markup in a real vulnerable page.", "For safety, this page shows the hypothetical response as inert text."];
      } else if (containsMarkup) {
        result.state = "allowed"; result.status = "OUTPUT ENCODED";
        result.decision = "The defended model encodes markup characters for the HTML text context before reflection.";
        result.response = "200 OK · encoded HTML response\n&lt;div class=\"result\"&gt;" + esc(value) + "&lt;/div&gt;\n\nDisplayed as text; no script runs.";
        result.trace = ["The request includes the sample text.", "The output encoder converts angle brackets and quotes to entities.", "The browser receives text rather than an executable element."];
      } else {
        result.state = "neutral"; result.status = "PLAIN TEXT";
        result.decision = "This input has no tag-shaped markup in the teaching model.";
        result.response = "200 OK\nSearch result for: " + value;
        result.trace = ["The request includes a search value.", "The teaching model finds no tag-shaped markup.", "The response contains ordinary text."];
      }
    } else if (id === "cmdi") {
      var hasSeparator = /;|&&|\|\||\|/.test(value);
      result.request = "POST /practice/lookup\nargument = " + value;
      if (hasSeparator && unsafe) {
        var commands = value.split(/;|&&|\|\|/).map(function (part) { return part.trim(); }).filter(Boolean);
        result.state = "exposed"; result.status = "COMMAND SPLIT SIMULATED";
        result.decision = "The vulnerable model builds one shell string, so the separator is treated as control syntax and splits the sample into multiple operations.";
        result.response = "200 OK · simulated output only\n" + commands.map(function (command) { return "$ " + command + " → [synthetic output]"; }).join("\n") + "\n\nNo command was executed.";
        result.trace = ["The request supplies an argument to a utility.", "The vulnerable design concatenates it into shell command text.", "The semicolon is interpreted as a command separator in the model.", "Synthetic output is shown; no operating-system process starts."];
      } else if (hasSeparator) {
        result.state = "blocked"; result.status = "INPUT REJECTED";
        result.decision = "The defended policy rejects shell control characters and uses a fixed executable with a separate argument list.";
        result.response = "400 Bad Request\nThe sample contains a shell control separator.\nNo process was started.";
        result.trace = ["The request supplies a utility argument.", "The server validates against a narrow allow-list.", "The separator is rejected before process creation.", "No operating-system process starts."];
      } else {
        result.state = "allowed"; result.status = "ONE ARGUMENT";
        result.decision = "The value contains no recognized separator and remains one argument to the fixed operation.";
        result.response = "200 OK · simulated lookup\nargument treated literally: " + value;
        result.trace = ["The request supplies one utility argument.", "The server keeps the executable fixed.", "The value remains one argument; the model does not start a process."];
      }
    }
    if (result.state === "blocked") result.statusCode = id === "cmdi" ? 400 : 403;
    if (result.status === "NOT FOUND") result.statusCode = 404;
    result.request = makeRawRequest(id, value, shell);
    shell.setAttribute("data-demo-state", result.state);
    shell.querySelector(".practice-window").setAttribute("data-demo-state", result.state);
    shell.querySelector("[data-demo-status]").textContent = result.status;
    shell.querySelector("[data-demo-request]").textContent = result.request;
    shell.querySelector("[data-demo-response]").textContent = makeRawResponse(id, value, result);
    shell.querySelector("[data-demo-decision]").textContent = result.decision;
    renderSimulatedApp(shell, id, value, result, unsafe);
    if (focusOptions && focusOptions.focusAppInput) {
      var refreshedAppField = shell.querySelector("[data-app-live-input]");
      if (refreshedAppField) {
        refreshedAppField.focus({ preventScroll: true });
        if (typeof refreshedAppField.setSelectionRange === "function" && focusOptions.selectionStart !== undefined) {
          refreshedAppField.setSelectionRange(focusOptions.selectionStart, focusOptions.selectionEnd);
        }
      }
    }
    var trace = shell.querySelector("[data-demo-trace]");
    trace.replaceChildren();
    result.trace.forEach(function (line) {
      var step = document.createElement("li");
      step.textContent = line;
      trace.appendChild(step);
    });
  }
  function updateSearch() {
    var query = search.value.trim().toLowerCase();
    if (!query) {
      searchResults.innerHTML = "";
      searchResults.classList.remove("open");
      return;
    }
    var terms = query.split(/\s+/);
    var matches = searchIndex.filter(function (entry) {
      return terms.every(function (term) { return entry.text.indexOf(term) >= 0; });
    }).slice(0, 8);
    searchResults.innerHTML = matches.length ? matches.map(function (entry) {
      return '<button class="search-result" type="button" role="option" data-go="' + entry.section + '">' + esc(entry.title) + "<small>" + esc(findLabel(entry.section)) + "</small></button>";
    }).join("") : '<div class="search-empty">No match yet. Try a broader term.</div>';
    searchResults.classList.add("open");
  }

  search.addEventListener("input", updateSearch);
  search.addEventListener("focus", updateSearch);
  search.addEventListener("keydown", function (event) {
    if (event.key === "Escape") { searchResults.classList.remove("open"); search.blur(); }
    if (event.key === "Enter") {
      var first = searchResults.querySelector("[data-go]");
      if (first) { event.preventDefault(); go(first.getAttribute("data-go")); search.value = ""; searchResults.classList.remove("open"); }
    }
  });
  menuToggle.addEventListener("click", function () {
    var opening = !document.getElementById("sidebar").classList.contains("is-open");
    document.getElementById("sidebar").classList.toggle("is-open", opening);
    document.body.classList.toggle("menu-open", opening);
    menuToggle.setAttribute("aria-expanded", String(opening));
    menuToggle.setAttribute("aria-label", opening ? "Close course menu" : "Open course menu");
  });
  document.addEventListener("keydown", function (event) {
    if (event.key === "/" && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) {
      event.preventDefault();
      search.focus();
    }
    if (event.key === "Escape") closeMenu();
  });
  window.addEventListener("hashchange", function () {
    var id = location.hash.slice(1);
    if (pages[id]) go(id);
  });

  var start = location.hash.slice(1);
  go(pages[start] ? start : "overview");
})();
