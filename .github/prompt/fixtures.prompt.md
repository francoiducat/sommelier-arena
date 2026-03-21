# Features

## Leaderboard

As a participant, after each question I want to see a leaderboard with the top 10 participants and their scores, so that I can track my progress and compare it with others.

## Host questions

For the question: What is the color of this wine?
Answers should be autocompleted with A. Rouge, B. Blanc, C. Rosé, D. Orange.
Host can still override the answers if they want to, but these should be the default options for this question.

For the question: What is the country of origin of this wine?
Change it to:
Which country or region might this wine come from?
Answers should be autocompleted with A. Bordeaux (France), B. Burgundy (France), C. Loire Valley (France), D. Tuscany (Italy).
Host can still override the answers if they want to, but these should be the default options for this question.

For the question: What is the vintage year of this wine?
Answers should be autocompleted with A. 2015, B. 2016, C. 2017, D. 2018.
Host can still override the answers if they want to, but these should be the default options for this question.

Add one question: What is the name of the wine?
Answers should be autocompleted with A. Château Margaux, B. Domaine de la Romanée-Conti, C. Château Lafite Rothschild, D. Château Latour.
Host can still override the answers if they want to, but these should be the default options for this question.

# Improvements:

## Randomize the order of questions presented to participants.

For the moment the correct answer is always the first one A.
Expected: Questions should be presented in random order to participants. 

## Persistence of scores and leaderboard

Currently, scores and leaderboard are reset after each round. Expected: Scores and leaderboard should persist across rounds, allowing participants to track their progress over time.

## Session management for participants

Currently, when a participants closes its browser or refreshes the page, they lose everything and must start from scratch. Expected: Implement session management for participants, allowing them to retain their scores and progress even if they close the browser or refresh the page.

## Answer validation

Currently, as soon as a participant selects an answer, he cannot change it.
Expected: Allow participants to change their answer until the timer ends, giving them the opportunity to reconsider their choice.

## Timer management

As a host I want to be able to set the length ot the timer for all questions, so that I can control the pace of the game and make it more engaging for participants.

## Session/Quiz management

As a host I want to be able to create and manage multiple sessions/quizzes, so that I can organize different games for different groups of participants.

As a host I should be able to see all the sessions/quizzes I have created, along with their details (name, date created, number of participants, leaderboard etc.) and be able to delete them if I want to.

## Performance summary and replay option for participants

As a participant, once a session/quiz has ended, I want to be able to see a summary of my performance, including the questions I got right and wrong, my final score, and how I ranked on the leaderboard. I cant also join another session/quiz if I want to with some kind of "Play again" button, so that I can continue to enjoy the game and improve my knowledge.

# Docs

Add a glossary of web app features and terms for new users to understand the platform better. (round, question, answer, score, leaderboard, session/quizz etc.)
Ensure two words similar in meaning are not used anymore. Stick to one term for consistency. For example, use "session" instead of "quiz" throughout the documentation and user interface and the backend code.

