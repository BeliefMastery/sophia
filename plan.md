# Sophia plan

This is the research and creation plan named in `sophiaplam.md`. That file stays the scope. This file says who the site is for, what it will and will not do, how study works, and the order to build it.

Sophia is a school substitute for one student and her parent, covering the senior secondary years from the final term of 2026 through 2028. It is a React site with logins and a Firebase Realtime Database. The curriculum is built from a testing loop: a check of what she already knows, or a research task that makes her compare options and use precise words.

## What Sophia is

Sophia is the place where daily study happens.

A study session shows a question first. A long explanation stays closed until she asks for it, or until a check shows she needs it. The screen is divided into bezels, so the question, her answer, the research, and the words she needs are separate zones.

Two people sign in:

- the student, who studies and answers
- the parent, who writes and edits study material, reviews answers, and can see progress

## What Sophia is not

Sophia does not award NCEA, University Entrance, or any other qualification. Those awards come from NZQA. Practice inside Sophia is practice. It is labeled as practice so it cannot be mistaken for an external assessment or a school's internal assessment.

Sophia is not a school for other families, and it is not Te Aho o Te Kura Pounamu. It does not use Cloud Firestore. The database is the Firebase Realtime Database already created for project `sophia-138fe` in `asia-southeast1`.

The database root stays closed. A signed-in student can read and write her own study record. The parent can read that record and can edit the curriculum. Nobody else can.

## The three years

The scope covers the final semester of 2026, then 2027, and then 2028, as the senior secondary years. This plan treats those years as:

| Calendar time | School year | Qualification aim |
| --- | --- | --- |
| Term 4, 2026 (now through mid-December) | Year 11 | Find the gaps. Start NCEA Level 1 work. Do not try to finish a whole certificate in one term. |
| 2027 | Year 12 | NCEA Level 2, and the start of University Entrance literacy. |
| 2028 | Year 13 | NCEA Level 3 and University Entrance. |

If she is already ahead or behind that year level, the same shape moves with her. The first job is to record her actual year level and any credits she already has. Subject content waits on that.

## Qualifications the study prepares for

NCEA has three certificates. Each one needs 60 credits at that level or above, plus a one-off co-requisite of 10 literacy or te reo matatini credits and 10 numeracy or te pāngarau credits. Once the co-requisite is met, it counts for every level. Credits can be earned over more than one year. Source: [NCEA levels and certificates](https://www2.nzqa.govt.nz/ncea/about-ncea/ncea-levels-and-certificates/).

Through the end of 2027, the co-requisite can be met either by the dedicated standards or by approved literacy and numeracy standards inside subjects. From 2028, only the dedicated standards count. Source: [NCEA co-requisite](https://ncea.education.govt.nz/overview-NCEA-corequisite-standards).

University Entrance is separate from the NCEA certificates. The 2026 rules require NCEA Level 3, 14 Level 3 credits in each of three approved subjects, 10 Level 2 or above literacy credits with at least 5 in reading and 5 in writing, and 10 numeracy or te pāngarau credits from the co-requisite standards or from NZQA's numeracy list. Source: Assessment and Examination for NCEA and New Zealand Scholarship Rules 2026, Schedule 2, clause 6.

Sophia can teach toward those requirements. Entry into the real assessments has to go through a registered school.

- Under 16, home education needs a Ministry of Education Certificate of Exemption under section 38 of the Education and Training Act 2020. The programme must teach at least as regularly and as well as a registered school. The certificate expires at 16, or earlier if she enrols in a school.
- A home-schooled student can be assessed for NCEA only through a link school that has consent to assess. No school is obliged to be that link. Source: [NZQA home-school assessment](https://www2.nzqa.govt.nz/about-us/rules-fees-policies/nzqa-rules/administrative-guidelines/internal-and-external-assessment-of-home-school-students/).
- From 16 to 19, Te Kura can be a free route into NCEA. Source: [Ministry of Education, qualifications for home-educated students](https://www.education.govt.nz/parents-and-caregivers/schools-year-0-13/home-education/qualifications-and-university-entry-home-educated-students).

The parent confirms which of these already applies. Sophia's job is the teaching programme the exemption describes, plus practice that matches the standards the link school will enter.

## The learning loop

Every topic is a test before it is a lesson. The test has two legal moves, and only these two:

1. She already has the knowledge or skill. The result is recorded and the topic is not taught again from the start.
2. She does not. The failed check becomes a research task. She has to look outside the page, compare more than one option, and come back with a judgement.

A research task always includes the words she needs. A difficult question is allowed to depend on a word she does not know yet. That word is revealed as part of the task, with a plain definition and one example, and a later question asks her to use it. Vocabulary is how the question gets harder. It is not a separate word list dumped on the screen.

The loop for one idea:

1. Probe. A short question, or a small skill check, with no lesson above it.
2. Result.
   - Known: mark it mastered and move.
   - Partly known: one short repair, then a new question. The new question is not the same item with the answer still in mind.
   - Unknown: open a research brief.
3. Research brief. One question she cannot answer from memory. At least two sources or two real options to compare. A short list of words she must use correctly. A written judgement in her own sentences.
4. Retest. New questions that need the same idea and the same words.
5. Parent review. The parent sees the probe, the research, and the retest, and can send it back.

Mastery means she can answer a fresh question, not that she has opened the panel. A topic can return later in a mixed check. If the mixed check fails, it goes back through the same loop.

Sophia practice is not the NZQA assessment. When a standard is the target, the on-screen work says which standard it is practising and that the official result happens only through the link school.

## The screen

The study screen is a set of bezels. A bezel is a visible frame with one job. Five are enough:

| Bezel | What it holds | When it is open |
| --- | --- | --- |
| Question | The probe or retest | Always |
| Answer | Her response and the submit action | Always, once a question is on screen |
| Research | Sources, the comparison, and her judgement | Only after a probe shows a gap |
| Words | The few words this question depends on | Only when the question needs a word she may not know |
| Parent | A note, or a request to redo | Parent account, and the student can read the note after it is sent |

Anything longer than the question starts collapsed. A heading shows what is inside. She opens it. Passages, examples, and worked solutions do not sit open as a wall of text.

The first screen she sees after login is the next probe, not a menu of readings.

## Course shape

Subjects are not frozen here. A default path keeps University Entrance reachable, and it can change once she says what she wants to study.

- English, because Level 2 and 3 English can carry University Entrance reading and writing.
- Mathematics, because numeracy has to be met, and some degrees ask for Level 3 mathematics beyond the minimum.
- One science she is willing to stay with through Level 3.
- One further approved subject she actually wants. That choice is hers.

Term 4 of 2026 is about eight teaching weeks. It is used to:

- run a diagnostic in reading, writing, and number
- see whether the literacy and numeracy co-requisite is already met
- choose the 2027 subjects
- run the full loop on one English idea and one mathematics idea, so the site is proven before it is filled with content

2027 carries the Level 2 programme and begins University Entrance literacy. 2028 carries Level 3, with 14 credits aimed at in each of three approved subjects, and finishes University Entrance numeracy if it is still open.

Standard numbers are chosen after the subjects are chosen, from the current NZQA lists. They are not invented in advance.

## Facts to confirm before content is written

These five answers change the curriculum. Content writing starts after them.

1. Year level in October 2026, and the credits already on her NZQA Record of Achievement.
2. Whether a section 38 exemption is in force, or she is already 16 or older.
3. Whether a link school has agreed to assess her, or Te Kura is the route.
4. The science and the fourth subject she wants.
5. Whether the 20-credit co-requisite is already complete. If it is not, 2026 and 2027 use the transition routes, and 2028 must use the dedicated standards.

## How the site is built

The client is a React app. Sign-in is Firebase Authentication, email and password, with the student account and the parent account created by the parent. There is no public registration.

The database is Realtime Database `https://sophia-138fe-default-rtdb.asia-southeast1.firebasedatabase.app`, project `sophia-138fe`. It is not Firestore.

Records are split so that a security rule can match a person to her own data:

- `users/{uid}` holds the display name and the role request. A client cannot grant itself the parent role.
- `roles/{uid}/parent` is written only from an admin credential, after the parent account exists.
- `progress/{uid}/...` holds probes, answers, research, and retests. The student and the parent can read and write that student's progress. No other account can.
- `curriculum/...` holds the probes, research briefs, and word lists. Any signed-in account can read it. Only the parent can write it.

The root has no read and no write. Admin access for deploying rules stays in a key held outside the repository, as a GitHub Actions secret. The credential that matches the admin account `firebase-adminsdk-fbsvc@sophia-138fe.iam.gserviceaccount.com` is the JSON private key from Firebase.

## Order of creation

1. This plan.
2. The five facts above, answered by the parent.
3. The app shell: both logins, the five bezels, one probe, one research brief, one retest, saved under `progress/{uid}`.
4. The parent review on that same piece of work.
5. A real diagnostic in reading, writing, and number, using the same loop.
6. The 2027 course, written only after the subjects and the credit record are known.
7. The 2028 course, aimed at Level 3 and University Entrance.

Each creation step is finished when the student can do the loop on real material, not when a page merely renders.

## Sources

- [NCEA levels and certificates](https://www2.nzqa.govt.nz/ncea/about-ncea/ncea-levels-and-certificates/)
- [NCEA co-requisite](https://ncea.education.govt.nz/overview-NCEA-corequisite-standards)
- [University Entrance literacy](https://www2.nzqa.govt.nz/ncea/understanding-secondary-quals/university-entrance/literacy-for-ue/)
- [NZQA rules for home-school assessment](https://www2.nzqa.govt.nz/about-us/rules-fees-policies/nzqa-rules/administrative-guidelines/internal-and-external-assessment-of-home-school-students/)
- [Education and Training Act 2020, section 38](https://www.legislation.govt.nz/act/public/2020/0038/latest/LMS176208.html)
- [Home education and qualifications](https://www.education.govt.nz/parents-and-caregivers/schools-year-0-13/home-education/qualifications-and-university-entry-home-educated-students)
