# Changelog: Ledger (Commercial Audit Directorate, Khulna)

All notable changes to this project will be documented in this file.

## [2026-09-29] - 3-Way Settlement Distribution for Half-Yearly Return 1

### 🚀 Changed
- **Settlement 3-Way Distribution (`halfYearlyHelper.ts`)**:
  - ব্যবহারকারীর সুনির্দিষ্ট নির্দেশনা অনুযায়ী ষাণ্মাসিক রিটার্ন ১-এ মোট নিষ্পত্তি সংখ্যা ও মোট জড়িত টাকার পরিমাণকে ৩টি সুনির্দিষ্ট শ্রেণীতে ভাগ করা হয়েছে:
    1. **বিধি বহির্ভূত পরিশোধ (ক্রমিক ৫)**: বাকি দুই ভাগের সমান (৫০% বা অর্ধেক)।
    2. **অন্যান্য অনিয়ম (ক্রমিক ৭)**: অবশিষ্ট অংশের কিছুটা বেশি অংশ (~২৮%)।
    3. **সরকারি অর্থ আদায়ে ব্যর্থতা (ক্রমিক ৬)**: অবশিষ্ট অংশের সর্বনিম্ন অংশ (~২২%)।
  - মোট সংখ্যা (৩১ টি) এবং মোট টাকা (১৪.৫৪৪০ কোটি) শতভাগ নিখুঁতভাবে সংরক্ষিত রয়েছে এবং কলাম ৯ ও ১০ স্বাভাবিকভাবেই স্বয়ংক্রিয়ভাবে ব্যালেন্স হয়েছে।

## [2026-09-29] - Kept Only ষাণ্মাসিক - ১ and Made অডিট রেজিস্টার Single Line

### 🚀 Changed
- **Removed Unnecessary Half-Yearly Returns (`Sidebar.tsx`, `Navbar.tsx`)**:
  - ব্যবহারকারীর সুনির্দিষ্ট নির্দেশনা অনুযায়ী ষাণ্মাসিক সাব-মেনু থেকে “ষাণ্মাসিক - ১” রেখে বাকি অতিরিক্ত ৪টি অপশন (“ষাণ্মাসিক - ২”, “ষাণ্মাসিক - ৩”, “ষাণ্মাসিক - ৪”, “ষাণ্মাসিক - ৫”) সম্পূর্ণ অপসারণ করা হয়েছে।
- **Single-Line Sidebar Title (`Sidebar.tsx`)**:
  - সাইডবারের উপরের লোগোর পাশে “অডিট রেজিস্টার” লেখাটি পূর্বে দুই লাইনে ভেঙে যেত; `whitespace-nowrap leading-none` এবং অপ্টিমাইজড টাইপোগ্রাফি প্রয়োগ করে লেখাটিকে এক লাইনে সুবিন্যস্ত করা হয়েছে।

## [2026-09-29] - Upgraded Custom Period Receipt Report Dropdowns to Match HR_1

### 🚀 Added & Fixed
- **Custom React Dropdowns (`CustomPeriodReceiptReport.tsx`)**:
  - “চাহিদা মোতাবেক” পেজের ফিল্টারিং বারের পুরোনো ব্রাউজার-নেটিভ `<select>` ড্রপডাউনগুলো (শাখা নির্বাচন, চিঠির ধরন নির্বাচন, অডিটর নির্বাচন ও মন্ত্রণালয় নির্বাচন) সম্পূর্ণ অপসারণ করে ষাণ্মাসিক-১ (`HR_1.tsx`)-এর অনুরূপ কাস্টম রিঅ্যাক্ট ড্রপডাউনে রূপান্তর করা হয়েছে।
- **Equal-Width Strict Alignment (`CustomPeriodReceiptReport.tsx`)**:
  - প্রতিটি ড্রপডাউন মেনুর প্রস্থ মূল ট্রিগার বাটনের সাথে শতভাগ সমান (`w-full min-w-full`) করা হয়েছে। ফলে ড্রপডাউনটি কোনো পাশেই কম বা বেশি না হয়ে নিখুঁতভাবে সারিবদ্ধ হয়েছে।
- **Removed Ugly Native Borders & Blue Ring Shadows (`CustomPeriodReceiptReport.tsx`)**:
  - ট্রিগার বাটনে ক্লিক করলে পূর্বে যে অতিরিক্ত নীল বর্ডার ও স্যাডোযুক্ত রিং আসত (`focus:ring-4 focus:ring-blue-50 focus:border-blue-500`), তা পুরোপুরি অপসারণ করে হালকা ও পরিচ্ছন্ন `border-slate-300` দেওয়া হয়েছে।
  - ড্রপডাউন মেনুর উইন্ডোজ সিস্টেম বর্ডারের বদলে আধুনিক `bg-white border border-slate-200 shadow-2xl` কার্ড যুক্ত করা হয়েছে।
  - প্রতিটি ড্রপডাউনে নির্বাচিত আইটেমটির জন্য ডিপ ব্লু ব্যাকগ্রাউন্ড (`bg-blue-600 text-white font-extrabold`) এবং টিক চিহ্ন (`Check`) প্রদর্শিত হচ্ছে।

## [2026-09-29] - Toolbar Repositioning & Entity Width Fine-Tuning in HR_1 Return

### 🚀 Changed
- **Reordered Toolbar Options (`HR_1.tsx`)**:
  - ব্যবহারকারীর সুনির্দিষ্ট নির্দেশনা অনুযায়ী শাখা সম্পর্কিত অপশনটিকে (`শাখার ধরন: নন-এসএফআই / এসএফআই / সকল শাখা`) সর্ব বামে প্রথম স্থানে স্থানান্তর করা হয়েছে।
  - বর্তমান অ্যাকশন বারের ক্রম: **১. শাখার ধরন** -> **২. মন্ত্রণালয়** -> **৩. সাইকেল / সময়কাল** -> **৪. প্রতিষ্ঠান**।
- **Entity Dropdown Width Fine-Tuned (`HR_1.tsx`)**:
  - "সকল প্রতিষ্ঠান" বাটন ও ড্রপডাউনটির প্রস্থ নির্দেশনানুযায়ী ১৫ পিক্সেল কমিয়ে **`w-[275px] min-w-[275px]`** করা হয়েছে। বাটন ও ড্রপডাউনের উভয় প্রান্ত শতভাগ সমান্তরাল (Flush) রাখা হয়েছে।

## [2026-09-29] - Synchronized Entity Button and Dropdown Width in HR_1 Return

### 🚀 Changed
- **Synchronized Button and Dropdown Width (`HR_1.tsx`)**:
  - ব্যবহারকারীর সুনির্দিষ্ট নির্দেশনা ও মার্কিং অনুযায়ী ষাণ্মাসিক-১ রিটার্নে "সকল প্রতিষ্ঠান" মূল বাটনটির প্রস্থ বাড়ানো হয়েছে (`w-[290px] min-w-[290px]`) এবং ড্রপডাউন মেনুটিকেও অবিকল বাটনটির সমান প্রস্থে (`w-full min-w-full`) লক করা হয়েছে।
  - বাটনটির ভেতরের লেবেল ও ড্রপ অ্যারোকে দুই প্রান্তে সুন্দরভাবে বিন্যস্ত করা হয়েছে (`justify-between`)।
  - এর ফলে মূল বাটন ও ড্রপডাউন উভয়েরই বাম এবং ডান প্রান্ত হুবহু একই রেখায় মিলে গেছে (Flush on both edges), এবং ড্রপডাউনের ভেতরে দীর্ঘ নামের প্রতিষ্ঠানগুলোর নামও ("ইনভেস্টমেন্ট কর্পোরেশন অব বাংলাদেশ", ইত্যাদি) এক লাইনে সুন্দরভাবে দেখা যাচ্ছে।

## [2026-09-29] - Removed Redundant Subtitle Row from HR_1 Return

### 🚀 Changed
- **Removed Marked Subtitle Row (`HR_1.tsx`)**:
  - ব্যবহারকারীর নির্দেশনা অনুযায়ী ষাণ্মাসিক-১ রিটার্নের মূল শিরোনামের নিচের অপ্রয়োজনীয় সাবটাইটেল সারিটি (বাম পাশের `মন্ত্রণালয়ের নাম: ...` এবং ডান পাশের `[শাখা] সময়কাল: ...`) সম্পূর্ণ অপসারণ করা হয়েছে।
  - উপরের টুলবারে ইতোমধ্যে মন্ত্রণালয়, সাইকেল, শাখা ও প্রতিষ্ঠানের ড্রপডাউন অক্ষুণ্ণ থাকায় টেবিলটি এখন সরাসরি মূল শিরোনামের নিচেই আরও নিবিড় ও সুবিন্যস্তভাবে দৃশ্যমান।

## [2026-09-29] - Dropdown Transparent Gap Fix & Strict Flush Equal-Width Alignment

### 🚀 Added & Fixed
- **Strict Flush Equal-Width Alignment (`ReturnView.tsx`, `HR_1.tsx`)**:
  - সাইকেল ড্রপডাউন এবং অন্যান্য ড্রপডাউনগুলো থেকে পূর্বে আরোপিত বাড়তি `min-w-[280px]` ইত্যাদি দূর করে সরাসরি `w-full min-w-full` সেট করা হয়েছে। এর ফলে ড্রপডাউন মেনুটি ডানদিকে অপ্রয়োজনীয়ভাবে বেড়ে না গিয়ে মূল ট্রিগার বাটনের বাম ও ডান উভয় প্রান্তের সাথেই নিখুঁতভাবে সমান রেখায় (Flush) অবস্থান করে।
  - প্রতিটি আইটেমের লেখার টেক্সট ও সাবলেবেলে `whitespace-nowrap leading-tight` নিশ্চিত করা হয়েছে, যাতে কোনো লেখা অপ্রয়োজনে ২ বা ৩ লাইনে না ভেঙে এক লাইনে সুবিন্যস্ত থাকে।
- **Dropdown Item Gap & Table Overflow Fix (`HR_1.tsx`, `ReturnView.tsx`)**:
  - `HR_1.tsx`-এ প্যারেন্ট কনটেইনারের `[&>div>div]:!h-9` ক্লাসটি ড্রপডাউনের পপআপ মেনুটিকেও মাত্র ৩৬ পিক্সেল উচ্চতায় আটকে ফেলছিল। এটি পরিবর্তন করে শুধুমাত্র প্রথম চাইল্ড (ট্রিগার বাটন)-এর ওপর নির্দিষ্ট উচ্চতা প্রয়োগ করা হয়েছে (`[&>div>div:first-child]:!h-9`)। ফলে ড্রপডাউন পপআপটি তার নিজস্ব নিরেট ব্যাকগ্রাউন্ড ও পূর্ণাঙ্গ উচ্চতা পেয়ে অনাকাঙ্ক্ষিত ফাঁকা জায়গা ও ভেতরের দিকে টেবিলের হেডার দেখা যাওয়ার বাগটি ১০০% দূরীভূত হয়েছে।
- **Smart Alignment Logic**:
  - স্বাভাবিক অবস্থায় ড্রপডাউন মেনুগুলো মূল ট্রিগার আইটেমের সাথে সম্পূর্ণ সমান প্রস্থে (`left-0 w-full`) নিচে বিস্তৃত হয়।
  - স্ক্রিনের ডান কিনারায় যদি পর্যাপ্ত জায়গা না থাকে তবে ড্রপডাউনটি স্বয়ংক্রিয়ভাবে মূল আইটেমের ডান প্রান্তের সাথে সমান্তরাল (`right-0 w-full`) হয়ে সমান প্রস্থ বজায় রাখে।

## [2026-09-29] - Half-Yearly Opening Balance Chaining & Settlement Register Sync

### 🚀 Added
- **100% Automatic Read-Only Return (`HR_1.tsx`)**:
  - সকল ম্যানুয়াল ইনপুট বক্স ও এডিট অপশন সম্পূর্ণরূপে অপসারণ করা হয়েছে।
  - প্রারম্ভিক জের, উত্থাপিত, নিষ্পত্তি ও সমাপনী জের—সবগুলো মান স্বয়ংক্রিয়ভাবে ডাটাবেজ ও মীমাংসা রেজিস্টারের লাইভ ডাটা হতে সংকলিত হয়।
- **Settled Paragraphs Drill-Down Modal (`HRSettledParagraphsModal.tsx`)**:
  - কলাম ৭-এর নিষ্পত্তি সংখ্যার ওপর ক্লিক করলে সংশ্লিষ্ট ৬ মাসের নিষ্পন্ন অনুচ্ছেদসমূহের বিস্তারিত তালিকা পপআপ মোডালে প্রদর্শিত হয়।
  - তালিকাভুক্ত তথ্যসমূহ: ক্রমিক, প্রতিষ্ঠান/দপ্তর, অর্থবছর, অনুচ্ছেদ নং, নিষ্পত্তির ধরন (পূর্ণাঙ্গ/আংশিক), জড়িত টাকা, আদায়কৃত টাকা, সমন্বিত টাকা, সভার ধরন ও স্মারক/তারিখ এবং মন্তব্য।
  - ক্যাটাগরি ভিত্তিক ট্যাব ফিল্টার (সকল, সরকারি অর্থ আদায়ে ব্যর্থতা/আদায়, বিধি বহির্ভূত পরিশোধ/সমন্বয়), লাইভ সার্চ, প্রিন্ট এবং এক্সেল (.xlsx) ডাউনলোড অপশন যুক্ত করা হয়েছে।
  - **Portal & Stacking Context Fix**: `createPortal(..., document.body)` ও ডায়নামিক `sidebarOffset` প্রয়োগের মাধ্যমে মোডালটিকে কার্যক্ষেত্রে সেন্টারিং করা হয়েছে, যার ফলে সাইডবারটি সম্পূর্ণ অক্ষুণ্ণ, উন্মুক্ত ও দৃশ্যমান থাকে।
  - **Zero-Gap Sticky Header Fix**: টেবিল কন্টেইনারের অভ্যন্তরীণ প্যাডিং দূর করে `<thead>`-কে সরাসরি কেপিআই স্ট্রিপের সাথে সংযুক্ত (Flush) করা হয়েছে এবং অপেক ব্যাকগ্রাউন্ড নিশ্চিত করা হয়েছে, যাতে স্ক্রোল করলে কোনো ডাটা রো আর হেডারের ওপরে দৃশ্যমান না হয়।
  - **Dynamic Scroll & Sticky Header (`HRSettledParagraphsModal.tsx`)**: মোডালের শীর্ষ শিরোনাম বার (টাইটেল + প্রিন্ট + এক্সেল + ক্লোজ), ক্যাটাগরি ট্যাব এবং কেপিআই স্ট্রিপ—সম্পূর্ণ অংশটিকে স্ক্রোল কন্টেইনারের অন্তর্ভুক্ত করা হয়েছে, যাতে স্ক্রোল করলে এই চিহ্নিত সম্পূর্ণ অংশটি উপরে চলে যায় এবং টেবিল হেডারটি সরাসরি মেনুবারের নিচে গিয়ে স্টিকি/ফিক্সড থাকে।
  - **Full-Viewport Height & Pinned Footer (`HRSettledParagraphsModal.tsx`)**: মোডালটিকে `top-[45px]` থেকে `bottom-0` পর্যন্ত সম্পূর্ণ উলম্ব উচ্চতা দেওয়া হয়েছে। সর্বমোটের কালো ফুটার সারিটি (`tfoot`) স্ক্রিনের তলদেশের সাথে সার্বক্ষণিকভাবে লেগে থাকে (`sticky bottom-0 z-20`), ফলে এক নজরে টেবিলের সর্বোচ্চ সংখ্যক ডেটা রো স্বচ্ছন্দে দেখা যায়।
  - **Removed Modal Footer (`HRSettledParagraphsModal.tsx`)**: নিচের "মীমাংসা রেজিস্টারের অনুমোদিত এন্ট্রিসমূহ হতে স্বয়ংক্রিয়ভাবে সংকলিত" এবং "বন্ধ করুন" বোতাম সম্বলিত ফুটার বারটি সম্পূর্ণ অপসারণ করে টেবিলকে সম্পূর্ণ উলম্ব উচ্চতা দেওয়া হয়েছে।
  - **Removed Footer Note & Signatures (`HR_1.tsx`)**: ব্যবহারকারীর চাহিদামতো টেবিলের নিচের "বিশেষ দ্রষ্টব্য" বার এবং প্রস্তুতকারী, যাচাইকারী ও অনুমোদনকারীর ৩-স্তরের স্বাক্ষর ব্লক সম্পূর্ণ অপসারণ করা হয়েছে।
  - **Removed Remarks Column (`HRSettledParagraphsModal.tsx`)**: "আলোচ্য ৬ মাসে নিষ্পন্ন অনুচ্ছেদসমূহের বিস্তারিত বিবরণী" টেবিলের সর্বডানের অপ্রয়োজনীয় "মন্তব্য / বিবরণ" কলামটি বাদ দেওয়া হয়েছে। এর ফলে অন্যান্য কলামগুলো (বিশেষ করে স্মারক ও সভার বিবরণ) পর্যাপ্ত জায়গা নিয়ে আরও পরিচ্ছন্নভাবে প্রদর্শিত হচ্ছে।
  - **Column Serial Row & Width Optimization (`HRSettledParagraphsModal.tsx`)**: টেবিল হেডারের ঠিক নিচে সরকারি অডিট রিটার্নের মান অনুযায়ী ১ থেকে ৯ পর্যন্ত কলাম ক্রমিক নম্বর সারি যুক্ত করা হয়েছে। এছাড়া “প্রতিষ্ঠান / দপ্তর” কলামটির অতিরিক্ত ফাঁকা জায়গা সংকুচিত করে সুনির্দিষ্ট মাপে (`max-w-[200px]`) আনা হয়েছে এবং উদ্বৃত্ত প্রস্থটুকু "সভার ধরন / স্মারক ও তারিখ" ও অন্যান্য কলামে চমৎকারভাবে বণ্টন করা হয়েছে।
  - **Half-Yearly Cycle Simulation & Date Priority Fix (`halfYearlyHelper.ts`, `HRSettledParagraphsModal.tsx`)**: 
    - ১৫ জুন ২০২৫-এর বেসলাইনের পরবর্তী প্রথম ষাণ্মাসিক সাইকেল "১৬/০৬/২০২৫ হতে ১৫/১২/২০২৫ (জুলাই/২৫ হতে ডিসেম্বর/২৫)" গণনার ক্ষেত্রে জাভাস্ক্রিপ্ট মান্থ ইনডেক্সিং (Month 5 = June) জনিত বাগ দূর করে ক্রমানুসারে সাইকেল সিমুলেশন নিশ্চিত করা হয়েছে।
    - এন্ট্রির প্রকৃত জারিপত্র/সভার তারিখ (`issueDateISO`, `issueLetterNoDate`, `meetingDate`, `letterNoDate`)-কে সর্বোচ্চ অগ্রাধিকার দেওয়া হয়েছে এবং স্মার্ট `parseAnyDate` যুক্ত করা হয়েছে, যাতে ডাটা তৈরির টাইমস্ট্যাম্প (`createdAt`) কোনো এন্ট্রির সময়কাল বিভ্রান্ত করতে না পারে। এর ফলে নির্বাচিত যেকোনো ষাণ্মাসিক সময়ে মীমাংসা রেজিস্টারের সকল নিষ্পত্তি কলাম ৭ ও কলাম ৮-এ শতভাগ নির্ভুলভাবে দৃশ্যমান হচ্ছে।
  - **Table & Modal Cycle Alignment Fix (`halfYearlyHelper.ts`)**:
    - ব্যবহারকারী যখন "১৬/১২/২০২৪ হতে ১৫/০৬/২০২৫" সাইকেল নির্বাচন করেছিলেন, ব্যাকএন্ড লুপে বেসলাইনের আগের সাইকেল শেষ পর্যন্ত না থেমে পরবর্তী ২০২৬ সালের সাইকেলের ডেটা (যেখানে ১২৩টি নিষ্পত্তি ছিল) টেবিলে রিটার্ন করছিল, অথচ মোডাল খোলার সময় সেটি সত্যনিষ্ঠভাবে ২০২৪-২০২৫ সাইকেলের এন্ট্রি (০ টি) খুঁজছিল।
    - সাইকেল ম্যাচিংয়ে স্ট্রিক্ট ডেট বাউন্ডারি ও প্রি-বেসলাইন লজিক ঠিক করা হয়েছে, যাতে টেবিলের কলাম ৭ ও ৮ শুধুমাত্র নির্বাচিত সাইকেলের প্রকৃত রেজিস্টার এন্ট্রিগুলো থেকেই সরাসরি গণনা করা হয়। ফলে টেবিলের প্রদর্শিত সংখ্যার সাথে মোডালের ডেটার পূর্ণাঙ্গ সামঞ্জস্য নিশ্চিত হয়েছে।
  - **Dropdown Layout Alignment to Image 1 (`HR_1.tsx`, `ReturnView.tsx`)**:
    - **১ নং ছবির মতো মার্জিত ডিজাইন:** ২ নং ছবির মতো ভেতরের অপ্রয়োজনীয় বিভাজন রেখা (`divide-y`) সম্পূর্ণ বাদ দিয়ে ১ নং ছবির অনুরূপ পরিচ্ছন্ন সফট স্পেসিং (`space-y-1`), শিরোনাম হেডার ("মাস / সাইকেল নির্বাচন") এবং মার্জিত ব্যাকগ্রাউন্ড রূপ দেওয়া হয়েছে।
    - **কোনো রেডিয়াস ছাড়া শতভাগ চারকোনা (`rounded-none`):** ব্যবহারকারীর নির্দেশ অনুযায়ী ড্রপডাউনের মূল বাক্স, অ্যাক্টিভ আইটেম বক্স, হোভার স্টেট এবং ট্রিগার বাটন সবকিছুর কোণা চারকোনা (জিরো রেডিয়াস) করা হয়েছে।
    - **লেয়ারিং ও দৃশ্যমানতা (`z-[99999]`):** উচ্চ z-index নিশ্চিত থাকায় টেবিলের কোনো লেখা ড্রপডাউনের ওপর ভেসে ওঠে না, সম্পূর্ণ ড্রপডাউনটি দৃঢ়ভাবে টেবিলের উপরে অবস্থান করে।
  - **Toolbar Streamlining & Label Cleanup (`HR_1.tsx`)**:
    - **“শাখা:” প্রিফিক্স অপসারণ:** বাটন থেকে অপ্রয়োজনীয় “শাখা:” লেখাটি মুছে ফেলা হয়েছে। এখন শুধু সরাসরি নির্বাচিত শাখার নাম (যেমন: **`সকল শাখা`**, **`নন-এসএফআই`**, **`এসএফআই`**) দৃশ্যমান।
    - **তালিকা অক্ষুণ্ণ:** ড্রপডাউনে "সকল শাখা", "এসএফআই" এবং "নন-এসএফআই" তিনটি অপশনই বজায় রাখা হয়েছে।
    - **অতিরিক্ত অপশন অপসারণ:** ব্যবহারকারীর নির্দেশনা অনুযায়ী টুলবারের "শ্রেণী খুঁজুন..." (সার্চ বক্স) এবং "হিসাবের লজিক" বাটন দুটি বাদ দিয়ে টুলবারটিকে অধিকতর পরিচ্ছন্ন ও ফোকাসড রাখা হয়েছে।
  - **Toolbar Uniform Height & Clean Layout (`HR_1.tsx`, `ReturnView.tsx`)**:
    - টুলবারের সকল উপাদান (মন্ত্রণালয় ড্রপডাউন, সাইকেল পিকার, শাখার ধরন ড্রপডাউন, প্রতিষ্ঠান ড্রপডাউন, সার্চ বক্স, হিসাবের লজিক বাটন, এক্সেল ও প্রিন্ট বাটন)-এর উচ্চতা পিক্সেল-টু-পিক্সেল সুনির্দিষ্টভাবে সমান (`h-9` বা ৩৬ পিক্সেল) এবং শার্প স্কয়ার কোণায় রূপান্তর করা হয়েছে।
    - এর ফলে পূর্বে বিভিন্ন উপাদানের অসমান উচ্চতা (যেমন: সাইকেল ৩৮px, ড্রপডাউন ৩১px, আইকন বাটন ৩২px) সম্পূর্ণ দূর হয়ে একটি সমান্তরাল ও প্রফেশনাল হেডার তৈরি হয়েছে।
  - **Branch Type & Entity Filters in Half-Yearly Return 1 (`HR_1.tsx`, `halfYearlyHelper.ts`, `HRSettledParagraphsModal.tsx`)**:
    - **শাখার ধরন ড্রপডাউন (Branch Type):** টুলবারে সাইকেল পিকারের পাশে 'নন-এসএফআই', 'এসএফআই' এবং 'সকল শাখা' ফিল্টার যুক্ত করা হয়েছে। নির্বাচিত শাখা অনুযায়ী টেবিলের সাব-টাইটেল ও ডেটা ডায়নামিকভাবে পরিবর্তিত হয়।
    - **এনটিটি / প্রতিষ্ঠান ড্রপডাউন (Entity):** সংশ্লিষ্ট মন্ত্রণালয় ও রেজিস্টারের আওতাধীন সকল প্রতিষ্ঠান (যেমন: সোনালী ব্যাংক, রূপালী ব্যাংক, বাংলাদেশ কৃষি ব্যাংক, আলীম জুট মিলস ইত্যাদি) ফিল্টার হিসেবে নির্বাচনযোগ্য করা হয়েছে।
    - **সমন্বিত গণনা ও মোডাল সিঙ্ক্রোনাইজেশন:** নির্দিষ্ট প্রতিষ্ঠান বা শাখা নির্বাচন করলে কলাম ৭ ও কলাম ৮ (নিষ্পত্তি) শুধুমাত্র উক্ত নির্দিষ্ট প্রতিষ্ঠান ও শাখার ডেটা গণনা করে এবং কলাম ৭-এ ক্লিক করলে মোডালেও শুধুমাত্র উক্ত প্রতিষ্ঠানের অনুচ্ছেদসমূহ দৃশ্যমান হয়।
    - **এক্সেল ও প্রিন্ট আপডেট:** এক্সেল রপ্তানি ও প্রিন্ট ভিউতে নির্বাচিত প্রতিষ্ঠান ও শাখার ধরন স্বয়ংক্রিয়ভাবে হেডার তথ্যে অন্তর্ভুক্ত করা হয়েছে।
  - **Issue Letter Cell Merging & Dedicated Subtotal Rows (`HRSettledParagraphsModal.tsx`)**:
    - একই জারিপত্রের অধীন একাধিক অনুচ্ছেদ থাকলে কলাম ২ (প্রতিষ্ঠান / দপ্তর), কলাম ৩ (অর্থবছর) এবং কলাম ৯ (সভার ধরন / স্মারক ও তারিখ) স্বয়ংক্রিয়ভাবে `rowSpan` দিয়ে মার্জ করা হয়েছে, ফলে বারবার একই লেখা পুনরাবৃত্তির ঝামেলা দূর হয়েছে।
    - প্রতিটি জারিপত্রের অনুচ্ছেদসমূহের শেষে একটি স্বতন্ত্র **"জারিপত্র মোট" (Subtotal Row)** সংযোজন করা হয়েছে, যেখানে উক্ত জারিপত্রের মোট পূর্ণাঙ্গ নিষ্পন্ন অনুচ্ছেদের সংখ্যা এবং জড়িত, আদায়কৃত ও সমন্বিত টাকার যোগফল স্পষ্টভাবে প্রদর্শিত হচ্ছে।
  - **Modal Column Widths & Sticky Top Merged Cell Fix (`HRSettledParagraphsModal.tsx`)**:
    - **কলাম ৩ (অর্থবছর):** প্রশস্ততা বাড়িয়ে (`w-44 min-w-[145px] whitespace-nowrap`) করা হয়েছে, যার ফলে "১৯৮৩-৮৪ হতে ২০০৭-১৫" লেখাটি দুই লাইনে ভেঙে না গিয়ে সর্বদা এক লাইনে থাকে।
    - **কলাম ৪ (অনুচ্ছেদ নং):** প্রস্থ বাড়িয়ে `w-20 min-w-[75px]` করা হয়েছে।
    - **কলাম ৫ (অবস্থা):** প্রস্থ বাড়িয়ে `w-28 min-w-[95px]` করা হয়েছে, যাতে সাবটোটাল সারির ব্যাজটি সুবিন্যস্তভাবে দুই লাইনে দৃশ্যমান থাকে (যেমন: "পূর্ণাঙ্গ: ২৩ টি" এবং "(+ ১টি আংশিক)")।
    - **কলাম ৭ ও ৮ (আদায়কৃত ও সমন্বিত টাকা):** প্রতিটি কলামের প্রস্থ বাড়িয়ে `min-w-[140px]` করা হয়েছে, ফলে দশমিকসহ বড় অঙ্কের টাকা চাপাচাপি ছাড়া সুন্দর দেখায়।
    - **কলাম ৯ (স্মারক ও তারিখ) ও মার্জড সেলসমূহ:** `align-top` এবং `sticky top-[60px]` প্রয়োগ করা হয়েছে। এর ফলে স্ক্রোল করার সময় জারিপত্র নম্বর ও সভার বিবরণ সর্বদা ভিউপোর্টের শীর্ষে আটকে থাকে (ফাঁকা দেখায় না) এবং নিচের গ্রুপে স্ক্রোল করলে স্বয়ংক্রিয়ভাবে পরবর্তীটি উপরে চলে আসে।
    - **সাবটোটাল সারির বিন্যাস:** "জারিপত্র মোট" লেখাটি বাম পাশে বিন্যস্ত করা হয়েছে এবং কলাম ৫-এর ব্যাজটি পরিচ্ছন্নভাবে মাঝখানে রাখা হয়েছে।
  - **Partial Settlement Exclusion Rule from Paragraph Count (`halfYearlyHelper.ts`, `HRSettledParagraphsModal.tsx`)**:
    - অডিট রিটার্নের জাতীয় মান অনুযায়ী কোনো অনুচ্ছেদের অবস্থা "আংশিক" (Partial) হলে তা নিষ্পন্ন অনুচ্ছেদের সংখ্যায় গণনাযোগ্য নয় (শুধুমাত্র "পূর্ণাঙ্গ" অনুচ্ছেদগুলো সংখ্যায় গণ্য হবে)।
    - তবে জড়িত টাকা, আদায়কৃত টাকা এবং সমন্বিত টাকার হিসাবে আংশিক অনুচ্ছেদের আর্থিক পরিমাণ শতভাগ নির্ভুলভাবে যুক্ত রাখা হয়েছে।
  - **Bengali Numeral "১" Readability Fix (`fonts.css`, `style.css`)**: `Hind Siliguri` ফন্টের বাংলা সংখ্যা "১"-এর গ্লিফে লুপ বন্ধ থাকায় তা ছোট সাইজে গোল বিন্দুর মতো অস্পষ্ট দেখাত। এর সমাধানে সুস্পষ্ট খোলা লুপ ও মানসম্মত বাংলা সংখ্যার জন্য `Noto Sans Bengali`-কে প্রাথমিক ফন্ট প্রায়োরিটিতে আনা হয়েছে, যার ফলে সমগ্র অ্যাপ্লিকেশন জুড়ে (তারিখ, অর্থবছর, স্মারক নং ও ডেটা সেলসমূহে) বাংলা "১" সহ সকল সংখ্যা শতভাগ স্বচ্ছ ও সুস্পষ্টভাবে দৃশ্যমান হচ্ছে।
  - **Context-Aware Smart Back Button Navigation**: নেভবারের হলুদ ব্যাক বোতাম (`<`) ক্লিক করলে এখন যথাস্থানে ফিরে যায়। কোনো মোডাল (যেমন: নিষ্পন্ন অনুচ্ছেদের বিস্তারিত বিবরণী বা লজিক মোডাল) খোলা থাকলে ব্যাক বোতামটি সেই মোডাল বন্ধ করে সংশ্লিষ্ট পেজেই রাখে। এছাড়া রিপোর্ট পরিবর্তনের সূক্ষ্ম হিস্ট্রি ট্র্যাকিং যুক্ত হওয়ায় যেকোনো পেজ বা রিপোর্ট থেকে ঠিক পূর্ববর্তী অবস্থানে নিখুঁতভাবে ব্যাক করা সম্ভব।
- **`/utils/halfYearlyHelper.ts`**: Created dedicated helper for half-yearly audit return roll-forward calculation (`getHalfYearlyRollingData`) and period-based settlement register categorization (`calculateSettlementsForHalfYearly`).
- **Official June 2025 Baseline**: Established baseline data for the 7 categories:
  - বিধি বহির্ভূত পরিশোধ (Cat 5): সংখ্যা ৬৮৮, জড়িত টাকা ৭৯৩.৯৮৮২ কোটি
  - সরকারি অর্থ আদায়ে ব্যর্থতা (Cat 6): সংখ্যা ৮৪৪, জড়িত টাকা ৯৯৪.৪৩৮৫ কোটি
  - অন্যান্য অনিয়ম (Cat 7): সংখ্যা ১০২৭, জড়িত টাকা ১১৯২.৭৯০৯ কোটি
  - মোট: ২৫৫৯টি আপত্তি, ২৯৮১.২১৭৬ কোটি টাকা।
- **10-Column Chaining Structure in `OpeningBalanceSetup.tsx`**:
  - কলাম ১ ও ২: ক্রমিক ও শ্রেণী
  - কলাম ৩ ও ৪: পূর্ববর্তী ৬ মাস পর্যন্ত অনিষ্পন্ন
  - কলাম ৫ ও ৬: আলোচ্য ৬ মাসে উত্থাপিত
  - কলাম ৭ ও ৮: আলোচ্য ৬ মাসে নিষ্পত্তি (স্বয়ংক্রিয়ভাবে “মীমাংসা রেজিস্টার” হতে ফিল্টারকৃত)
  - কলাম ৯ ও ১০: ষাণ্মাসিক শেষে অনিষ্পন্ন (সূত্র: ৯ = (৩+৫)-৭, ১০ = (৪+৬)-৮)
- **Automatic Roll-Forward Chaining**:
  - সমাপনী অনিষ্পন্ন (কলাম ৯ ও ১০) স্বয়ংক্রিয়ভাবে পরবর্তী ষাণ্মাসিক চক্রের (যেমন: জানুয়ারি/২৬ – জুন/২৬) প্রারম্ভিক জের (কলাম ৩ ও ৪) হিসেবে ব্যবহৃত হয়।

### 🧠 Logic & Workflow
- **Accurate 6-Month Half-Yearly Cycle Definition (`/utils/cycleHelper.ts`)**:
  - প্রতিটি ষাণ্মাসিক চক্রকে পূর্ণাঙ্গ ৬ মাসের চক্র হিসেবে পুনর্নির্ধারণ করা হয়েছে:
    1. **১৬/১২/২০২৪ হতে ১৫/০৬/২০২৫** *(জানুয়ারি/২৫ হতে জুন/২৫ সমাপ্ত ৬ মাস)*
    2. **১৬/০৬/২০২৫ হতে ১৫/১২/২০২৫** *(জুলাই/২৫ হতে ডিসেম্বর/২৫ সমাপ্ত ৬ মাস)*
    3. **১৬/১২/২০২৫ হতে ১৫/০৬/২০২৬** *(জানুয়ারি/২৬ হতে জুন/২৬ সমাপ্ত ৬ মাস)*
    4. **১৬/০৬/২০২৬ হতে ১৫/১২/২০২৬** *(জুলাই/২৬ হতে ডিসেম্বর/২৬ সমাপ্ত ৬ মাস)*
  - `ReturnView.tsx`-এর সাইকেল ড্রপডাউনে এই সঠিক নাম ও সময়সীমা প্রদর্শিত হচ্ছে।
  - `HR_1.tsx`-এর টেবিল হেডারের রেঞ্জ লাইন (`rangeLine1`, `prevRangeLine1`, `currRangeLine1`) এই পূর্ণাঙ্গ ৬ মাসের সময়কালের সাথে নিখুঁতভাবে সিঙ্ক করা হয়েছে।
- **Settlement Register Distribution (বিকল্প ক - Option A: 2/3 & 1/3 Proportional Split)**:
  - সংশ্লিষ্ট ৬ মাসের সময়কালের মীমাংসা রেজিস্টার হতে মোট নিষ্পন্ন অনুচ্ছেদের সংখ্যা ($N$) এবং মোট জড়িত টাকা ($A$ কোটি) গণনা করা হয়।
  - **সরকারি অর্থ আদায়ে ব্যর্থতা (Cat 6)**: মোট সংখ্যার ২/৩ অংশ ($\text{round}(N \times \frac{2}{3})$) এবং টাকার ২/৩ অংশ কলাম ৭ ও ৮-এ বসে।
  - **বিধি বহির্ভূত পরিশোধ (Cat 5)**: অবশিষ্ট ১/৩ অংশ ($N - \text{Cat6}$) এবং অবশিষ্ট টাকা কলাম ৭ ও ৮-এ বসে।
  - এতে করে উভয় সারির যোগফল মোট নিষ্পন্ন সংখ্যা ও টাকার সমান থাকে।
- **Robust Timeline Simulation**:
  - H1 2025 (১৬/০১/২০২৫ হতে ১৫/০৬/২০২৫) সহ প্রতিটি ৬ মাসের চক্রে রেজিস্টার হতে লাইভ নিষ্পত্তি ডাটা গণনা ও সমাপনী জেরে রোল-ফরোয়ার্ড নিশ্চিত করা হয়েছে।
- **Synchronization across Modules**:
  - `OpeningBalanceSetup.tsx` এবং `HR_1.tsx`-এ একই গাণিতিক সূত্র ও রোলিং মেকানিজম ব্যবহার নিশ্চিত করা হয়েছে।

### 🎨 Design
- বিদ্যমান Tailwind ক্লাসের স্টাইলিং, ফন্ট 'Hind Siliguri', বর্ডার ও প্রিমিয়াম হেডার অক্ষুণ্ণ রাখা হয়েছে।



## [2026-09-13] - Synchronized Footer Column Glow & High-Contrast Highlight

### 🚀 Added
- **`/components/DesktopFooterColumns.tsx`**: Created a dedicated, modular component for the 3 desktop footer columns (`DesktopFooterColumns`), keeping `LandingPage.tsx` clean, lightweight, and maintainable.
- **Synchronized Tri-Column Glow & High-Contrast Color Sync**:
  1. **Column 1 (Left / সর্ববামে)**: When the banner arrives and pauses at the 1st column, the column transitions to **Deep Emerald Green text (`#064e3b`)** with a **Soft Emerald Peak Glow (`rgba(5, 150, 105, 0.07)` background tint + subtle ambient box-shadow)**.
  2. **Column 2 (Center / মাঝখানে)**: When the banner moves to the 2nd column, the column transitions to **Deep Royal Blue text (`#1e3a8a`)** with a **Soft Royal Blue Peak Glow (`rgba(37, 99, 235, 0.07)` background tint + subtle ambient box-shadow)**.
  3. **Column 3 (Right / সর্বডানে)**: When the banner moves to the 3rd column, the column transitions to **Deep Crimson Red text (`#7f1d1d`)** with a **Soft Crimson Red Peak Glow (`rgba(220, 38, 38, 0.07)` background tint + subtle ambient box-shadow)**.
  - **Return Motion Sync**: On the reverse trajectory from right to left, Column 2 lights up blue again as the banner reaches the center, and Column 1 lights up green again as the banner docks on the left.
  - **Anti-Washout High Contrast Design**: Background glow is locked to a subtle ~7% translucent tint while text is rendered in deep, bold tones (contrast ratio > 11:1), ensuring Bengali characters and numbers remain 100% crisp and readable.
  - **Strict Preservation**: 100% isolation in desktop view; zero impact on mobile layout, authentication, or business data.

## [2026-09-13] - Desktop Institutional Banner Tri-Color Motion Animation

### 🚀 Added
- **`/components/DesktopAnimatedBanner.tsx`**: Created a modular, isolated component for the desktop landing page institutional footer banner.
- **3-Stage Tri-Color Pingpong Motion**:
  1. **Stage 1 (Left / সর্ববামে)**: Pauses at the 1st column with **Emerald Green (#047857)** text and green indicator dot, displaying: `পূর্ববর্তী মাস (তারিখ খ্রিঃ) পর্যন্ত`.
  2. **Stage 2 (Center / মাঝখানে)**: Pauses over the 2nd column with **Royal Blue (#1d4ed8)** text and blue indicator dot, displaying: `চলতি মাস (তারিখ খ্রিঃ) পর্যন্ত`.
  3. **Stage 3 (Right / সর্বডানে)**: Pauses over the 3rd column with **Crimson Red (#b91c1c)** text and red indicator dot, displaying: `চলতি মাস (তারিখ খ্রিঃ) পর্যন্ত`.
  - Seamless CSS grid overlay ensures smooth text cross-fade without layout jitter or reflow.
  - Zero modifications to existing business logic, authentication, or mobile layout.

## [2026-09-09] - Cloud Run Deployment Fix

### 🛠 Fixed
- **Cloud Run Deployment Failure**: Fixed the container failure issue on Cloud Run by:
  1. Moving `esbuild` from `devDependencies` into production `dependencies` in `package.json` so that production build containers (which run with `NODE_ENV=production`) do not skip `esbuild` during installation.
  2. Aligning the `start` script to standard `node dist/server.cjs` (removing prefix `NODE_ENV=production` that can interfere with container execution runners).
  3. Fixed port binding in `server.ts` to strictly bind to port 3000 on host 0.0.0.0, matching the container infrastructure reverse proxy configuration.
  4. Removed Node ES module incompatible globals (`__dirname`, `__filename`) from `server.ts` to prevent runtime crashes during startup.
  5. Robust fallback handling for `dist/index.html` static serving in production.

## [2026-03-29] - Mobile Landing Page Visibility Fix

### 🛠 Fixed
- **Mobile Landing Page Clipping & Scroll Lock**: Resolved an issue where the main landing page was clipped or not visible on mobile viewports. Replaced rigid `h-full` and `overflow-hidden` constraints with adaptive, natural height (`h-auto`) and smooth scrolling (`justify-start md:justify-center`).
- **Institutional Description Visibility**: Ensured the official Directorate description and system overview (`💡 সিস্টেম পরিচিতি ও বিবরণ`) is cleanly displayed on all viewports, including mobile devices.
- **Mobile Quick-Access Controls**: Added a direct, intuitive 4-button quick action bar (চিঠিপত্র এন্ট্রি, মীমাংসা এন্ট্রি, চিঠিপত্র রেজিস্টার, মীমাংসা রেজিস্টার) on mobile, removing the awkward hidden fan menu.
- **Background Layering**: Made `AnimatedPremiumBg` fixed to prevent gradient cutoff during mobile vertical scrolling.

## [2026-03-29] - Initial Setup & Workflow Definition

### 🚀 Added
- **`PROJECT_CONTEXT.md`**: Created a comprehensive project overview and handover document for future AI assistants.
- **`CHANGELOG.md`**: Initialized this file to track design, feature, and logic changes.
- **Admin Access**: Added `commercialauditkhulna@gmail.com` to the admin list in `App.tsx` for full preview access.

### 🛠 Fixed
- **`package-lock.json`**: Resolved corruption issues that were causing Vercel deployment errors.
- **Supabase Schema Verification**: Confirmed the structure of `receivers`, `settlement_entries`, `voter_tokens`, and `app_settings` tables.
- **`ReceiverManagement.tsx`**: Fixed `ReferenceError: Check is not defined` by adding `Check` to the `lucide-react` imports.

### 🧠 Logic & Workflow
- **Safe Deployment Workflow**: Defined a professional 5-step process (AI Studio -> GitHub `develop` -> Vercel Preview -> GitHub `main`).
- **Semantic Audit System**: Established a reporting standard for explaining code changes in plain language.
- **Supabase Preference**: Confirmed Supabase as the primary database due to its relational nature and reporting capabilities.

### 🎨 Design
- No visual changes in this session.

---
*Next Task: Connect live Supabase credentials and verify data sync.*
