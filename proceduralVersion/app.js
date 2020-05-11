const fs = require('fs');
var article = fs.readFileSync('./inputs/article.txt', 'utf8');

var transitionPhrases = fs.readFileSync('./inputs/transition.txt', 'utf8');
transitionPhrases = transitionPhrases.split(',');
transitionPhrases = transitionPhrases.map(phrase => phrase.trim()); 

var summaryPhrases = fs.readFileSync('./inputs/summary.txt', 'utf8');
summaryPhrases = summaryPhrases.split(',');
summaryPhrases = summaryPhrases.map(phrase => phrase.trim());

var digits = fs.readFileSync('./inputs/digits.txt', 'utf8');
digits = digits.split(' ');

var parsedArticle = parseArticle(article);          // Parse article into paragraphs & sentences
var paragraphs = parsedArticle[0];
var sentences = parsedArticle[1];

paragraphs = setParagraphWeight(paragraphs);
sentences = setSentenceWeight(sentences);

var allWords = fetchWords(article);                 // Fetching all the words
var uniqueWords = [...new Set(allWords)];            // Taking distinct Words
var importantWords = removeUnimportantWords(uniqueWords);

var words = setWordWeight(importantWords);
words = setWordOccurances(words, importantWords, sentences);

var pwOfTerms = computePw(words, sentences, paragraphs);
var topicalTerms = selectTopicalTerms(pwOfTerms);

var previousAndNext = getPreviousAndNext(topicalTerms, allWords);
var previousTerms = previousAndNext[0];
var nextTerms = previousAndNext[1];

var pwOfPreviousTerms = getPwOfTerms(previousTerms, pwOfTerms);
var topPreviousTerms = getTopTerms(pwOfPreviousTerms);

var pwOfNextTerms = getPwOfTerms(nextTerms, pwOfTerms);
var topNextTerms = getTopTerms(pwOfNextTerms);

var compoundCandidates = getCompoundCandidates(topPreviousTerms, topNextTerms);
var compoundTerms = getCompoundTerms(compoundCandidates, previousTerms, nextTerms, topicalTerms);

outputToFile(topicalTerms, pwOfTerms, compoundTerms);


function parseArticle(article) {
    var paragraphs = [];
    var sentences = [];
    var Initialparagraphs = article.split('\n');
    var index = 0;
    Initialparagraphs.forEach(initialParagraph => {
        // If it is not an empty paragraph
        if (initialParagraph.length != 0) {
            // Splitting it into sentences
            var initialSentences = initialParagraph.split('।');

            // Checking Validity    
            // Checking if the paragraph only contains blank space or not
            var isValid = true;
            if (initialSentences.length == 1 && initialSentences[0].trim().length == 0) {
                isValid = false;
            }

            // Converting Valid Paragraph into an array of sentences
            // And pushing it into an array of paragraphs
            if (isValid) {
                initialSentences = initialSentences.map(initialSentence => initialSentence.trim());
                paragraphs.push(initialSentences);
                initialSentences.forEach(initialSentence => sentences.push({ "paragraph": index, "words": initialSentence }));
                index++;
            }
        }

    });
    return [paragraphs, sentences];
}

function fetchWords(article) {
    var words = [];
    var spacedWords = article.replace(/[\r\n]+/g, " ");
    spacedWords = spacedWords.replace('।', ' ');
    var initialWords = spacedWords.split(' ');
    initialWords = initialWords.map(initialWord => initialWord.trim());

    initialWords.forEach(initialWord => {
        if (initialWord.length > 0) {
            words.push(initialWord);
        }
    });
    return words;
}

function setParagraphWeight(paragraphs) {
    for (let index = 0; index < paragraphs.length; index++) {
        var paragraph = paragraphs[index];
        var firstSentence = paragraph[0];

        // Setting Title
        if (index == 0) {
            paragraph = { "weight": 4 };
        }

        // Setting Subtitle if any
        else if (index == 1 && paragraph.length == 1) {
            paragraph = { "weight": 3.5 };
        }

        else {
            var set = false;
            // Setting Leading or Conclusion
            summaryPhrases.forEach(phrase => {
                if (firstSentence.indexOf(phrase) == 0) {
                    paragraph = { "weight": 3 };
                    set = true;
                }
            });

            // Setting Transition
            if (!set) {
                transitionPhrases.forEach(phrase => {
                    if (firstSentence.indexOf(phrase) == 0) {
                        paragraph = { "weight": 2 };
                        set = true;
                    }
                });
            }

            // Setting Others
            if (!set) {
                paragraph = { "weight": 1 };
                set = true;
            }
        }

        paragraphs[index] = paragraph;
        // console.log(paragraph);
    }
    return paragraphs;
}

function setSentenceWeight(sentences) {
    for (let index = 0; index < sentences.length; index++) {
        var sentence = sentences[index];
        var paragraph = sentence.paragraph;
        var words = sentence.words;
        var set = false;

        // Setting Title
        if (sentence.paragraph == 0) {
            sentence = { "paragraph": paragraph, "weight": 4, "words": words };
            set = true;
        }

        // Setting Leading or Conclusion
        if (!set) {
            summaryPhrases.forEach(phrase => {
                if (words.indexOf(phrase) == 0) {
                    sentence = { "paragraph": paragraph, "weight": 3, "words": words };
                    set = true;
                }
            });
        }

        // Setting Transition
        if (!set) {
            transitionPhrases.forEach(phrase => {
                if (words.indexOf(phrase) == 0) {
                    sentence = { "paragraph": paragraph, "weight": 2, "words": words };
                    set = true;
                }
            });
        }

        // Setting Others
        if (!set) {
            sentence = { "paragraph": paragraph, "weight": 1, "words": words };
            set = true;
        }

        sentences[index] = sentence;
        // console.log(sentence);
    }
    return sentences;
}

function setWordWeight(wordStrings) {
    var words = [];
    for (let index = 0; index < wordStrings.length; index++) {
        var word = wordStrings[index];
        var letters = word;
        var set = false;

        // Setting Words with Digits
        for (let j = 0; j < digits.length; j++) {
            var digit = digits[j];
            if (word.indexOf(digit) != -1 && word.indexOf(digit) != 0 && word.indexOf(digit) != 1) {
                word = { "occurrence": [], "weight": 3, "letters": letters };
                set = true;
                break;
            }
        }


        // Setting Others
        if (!set) {
            word = { "occurrence": [], "weight": 1, "letters": letters };
        }

        words.push(word);
    }
    return words;
}

function removeUnimportantWords(words) {
    transitionPhrases.forEach(phrase => {
        if (words.indexOf(phrase) > -1) {
            words.splice(words.indexOf(phrase), 1);
        }
    });

    summaryPhrases.forEach(phrase => {
        if (words.indexOf(phrase) > -1) {
            words.splice(words.indexOf(phrase), 1);
        }
    });

    return words;
}

function setWordOccurances(words, wordStrings, sentences) {
    for (let index = 0; index < sentences.length; index++) {
        var sentence = sentences[index];
        var sentenceWords = sentence.words.split(' ');
        sentenceWords.forEach(sentenceWord => {
            if (wordStrings.indexOf(sentenceWord) > -1) {
                words[wordStrings.indexOf(sentenceWord)].occurrence.push({ "sentence": index, "paragraph": sentence.paragraph });
            }
        });
    }
    return words;
}

function computePw(words, sentences, paragraphs) {
    var pwOfTerms = [];
    words.forEach(word => {
        var pwd = 0;
        var pwt = [];
        word.occurrence.forEach(position => {
            pwt.push(word.weight * sentences[position.sentence].weight * paragraphs[position.paragraph].weight);
            pwd += word.weight * sentences[position.sentence].weight * paragraphs[position.paragraph].weight;
        });
        pwOfTerms.push({ "word": word.letters, "occurred": word.occurrence.length, "pwt": pwt, "pwd": pwd });
    });
    return pwOfTerms;
}

function compareValues(key, order = 'asc') {
    return function innerSort(a, b) {
        if (!a.hasOwnProperty(key) || !b.hasOwnProperty(key)) {
            return 0;
        }

        const varA = (typeof a[key] === 'string')
            ? a[key].toUpperCase() : a[key];
        const varB = (typeof b[key] === 'string')
            ? b[key].toUpperCase() : b[key];

        let comparison = 0;
        if (varA > varB) {
            comparison = 1;
        } else if (varA < varB) {
            comparison = -1;
        }
        return (
            (order === 'desc') ? (comparison * -1) : comparison
        );
    };
}

function selectTopicalTerms(pwOfTerms) {
    pwOfTerms.sort(compareValues('pwd', 'desc'));
    var maxPwOfTerms = pwOfTerms[0].pwd;
    var threshold = maxPwOfTerms / 6;
    var topicalTerms = [];
    pwOfTerms.forEach(pwOfTerm => {
        if (pwOfTerm.pwd > threshold) {
            topicalTerms.push(pwOfTerm);
        }
    });
    return topicalTerms;
}

function outputTopicalTerms(topicalTerms){
    var index = 1;
    var appendTitle = "### TOPICAL TERMS ###\n\n";
    var appendTerms = "## Terms \n\n";
    var appendDetails = "## Details\n\n";

    topicalTerms.forEach(topicalTerm => {
        appendDetails += "# " + index + "\n";
        appendDetails += "Term       :" + topicalTerm.word + "\n";
        appendDetails += "Occurence  :" + topicalTerm.occurred + "\n";
        appendDetails += "PWT        :" + topicalTerm.pwt + "\n";
        appendDetails += "PWD        :" + topicalTerm.pwd + "\n\n";
        appendTerms += topicalTerm.word + "\n";
        index++;
    });
    appendTerms += "\n";
    var appendText = appendTitle + appendTerms + appendDetails;
    fs.writeFileSync('./outputs/topicalTerms.txt', appendText, 'utf8');
}

function outputAllTerms(allTerms){
    var index = 1;
    var appendText = "### ALL TERMS ###\n\n";
    allTerms.forEach(term => {
        appendText += "# " + index + "\n";
        appendText += "Term       :" + term.word + "\n";
        appendText += "Occurence  :" + term.occurred + "\n";
        appendText += "PWT        :" + term.pwt + "\n";
        appendText += "PWD        :" + term.pwd + "\n\n";
        index++;
    });
    fs.writeFileSync('./outputs/allTerms.txt', appendText, 'utf8');
}

function outputCompoundTerms(compoundTerms){
    var index = 1;
    var appendText = "### COMPOUND TERMS ###\n\n";
    compoundTerms.forEach(term => {
        appendText += "# " + index + "\n";
        appendText += "Topical      :" + term.topical + "\n";
        appendText += "Compound     :" + term.compound + "\n\n";
        index++;
    });
    fs.writeFileSync('./outputs/compoundTerms.txt', appendText, 'utf8');
}

function outputToFile(topicalTerms, allTerms, compoundTerms) {
    outputTopicalTerms(topicalTerms);
    outputAllTerms(allTerms);
    outputCompoundTerms(compoundTerms);
}

function getPreviousAndNext(topicalTerms, allWords){
    var previousTerms = [];
    var nextTerms = [];
    var topicalTermWords = topicalTerms.map(topicalTerm => topicalTerm.word);
    for(let i=0;i<allWords.length;i++){
        var topicalTermIndex = topicalTermWords.indexOf(allWords[i]);
        if(topicalTermIndex>-1){
            if(allWords[i-1]){
                if(!previousTerms[topicalTermIndex]){
                    previousTerms[topicalTermIndex] = [];
                } 
                previousTerms[topicalTermIndex].push(allWords[i-1]);
            }
            if(allWords[i+1]){
                if(!nextTerms[topicalTermIndex]){
                    nextTerms[topicalTermIndex] = [];
                } 
                nextTerms[topicalTermIndex].push(allWords[i+1]);
            }
        }
    }
    return [previousTerms, nextTerms];
}

function getPwOfTerms(terms, pwOfTerms){
    var pwTerms = [];
    var pwOfTermWords = pwOfTerms.map(pwOfTerm => pwOfTerm.word);
    for(let i=0; i<terms.length; i++){
        pwTerms[i] = [];
        terms[i].forEach(term => {
            let pwTermIndex = pwOfTermWords.indexOf(term);
            if(pwTermIndex>-1){
                pwTerms[i].push(pwOfTerms[pwTermIndex]);
            }
        });
    }
    return pwTerms;
}

function getTopTerms(terms){
    var topTerms = [];
    terms.forEach(term =>{
        term.sort(compareValues('pwd', 'desc'));
        topTerms.push(term[0]);
    });
    return topTerms;
}

function getCompoundCandidates(topPreviousTerms, topNextTerms){
    var candidates = [];
    for(let i=0; i<topPreviousTerms.length; i++){
        if(topPreviousTerms[i].pwd > topNextTerms[i].pwd){
            candidates.push({"type": "previous", "term":topPreviousTerms[i]});
        } else{
            candidates.push({"type": "previous", "term":topNextTerms[i]});
        }
    }
    return candidates;
}

function getCompoundTerms(compoundCandidates, previousTerms, nextTerms, topicalTerms){
    var compoundTerms = [];
    for(let i=0;i<topicalTerms.length;i++){
        var threshold = topicalTerms[i].occurred/6;
        var f = 0;
        if(compoundCandidates[i].type == "previous"){
            previousTerms[i].forEach(previousTerm =>{
                if(previousTerm == compoundCandidates[i].term.word){
                    f++;
                }
            });
            if(f>threshold){
                compoundTerms.push({"topical": topicalTerms[i].word, "compound":compoundCandidates[i].term.word + " " + topicalTerms[i].word});
            }
        } else{
            nextTerms[i].forEach(nextTerm =>{
                if(nextTerm == compoundCandidates[i].term.word){
                    f++;
                }
            });
            if(f>threshold){
                compoundTerms.push({"topical":  topicalTerms[i].word, "compound": topicalTerms[i].word + " " + compoundCandidates[i].term.word});
            }
        }
    }
    return compoundTerms;
}

/************************ Logs *******************************/

// showParagraphs(paragraphs);
// showSentences(sentences);
// showWords(words);
// showPwOfTerms(pwOfTerms);
// showPwOfTerms(topicalTerms);
// showPreviousTopicalNext(previousTerms, topicalTerms, nextTerms);

function showParagraphs(paragraphs) {
    var index = 0;
    paragraphs.forEach(paragraph => {
        console.log(index + "  |   " + paragraph.weight);
        index++;
    });
}

function showSentences(sentences) {
    var index = 0;
    sentences.forEach(sentence => {
        console.log(index + "  |   " + sentence.paragraph + "  |   " + sentence.weight + "  |   " + sentence.words);
        index++;
    });
}

function showWords(words) {
    var index = 0;
    words.forEach(word => {
        console.log(index + "  |   " + word.weight + "  |   " + word.letters + "  |   " + word.occurrence);
        index++;
    });
    console.log(words.length);
}

function showPwOfTerms(pwOfTerms) {
    var index = 0;
    pwOfTerms.forEach(pwOfTerm => {
        console.log(index);
        console.log("Term       :" + pwOfTerm.word)
        console.log("Occurence  :" + pwOfTerm.occurred);
        console.log("PWT        :" + pwOfTerm.pwt);
        console.log("PWD        :" + pwOfTerm.pwd);
        console.log();
        index++;
    });
}

function showPreviousTopicalNext(previousTerms, topicalTerms, nextTerms){
    for(let i=0;i<topicalTerms.length;i++){
        console.log(previousTerms[i]);
        console.log(topicalTerms[i].word);
        console.log(nextTerms[i]);
        console.log();
    }
}
