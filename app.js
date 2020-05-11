const fs = require('fs');

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

class Data {
    constructor(path) {
        this.adjectiveList = this.read(path, '/adjectiveList.txt');
        this.uposorgoList = this.read(path, '/uposorgoList.txt');
        this.specialCharList = this.read(path, '/specialCharList.txt');
        this.digitList = this.read(path, '/digitList.txt');

        this.verbListFinite = this.read(path, '/verbListFinite.txt');
        this.nounListProper = this.read(path, '/nounListProper.txt');
        this.karList = this.read(path, '/karList.txt');

        this.suffixListBivokti = this.read(path, '/suffixListBivokti.txt');
        this.suffixListCollectiveNoun = this.read(path, '/suffixListCollectiveNoun.txt');
        this.suffixListMaterialNoun = this.read(path, '/suffixListMaterialNoun.txt');
        this.suffixListNumberIdentifier = this.read(path, '/suffixListNumberIdentifier.txt');

        this.phraseListTransition = this.read(path, '/phraseListTransition.txt');
        this.phraseListSummary = this.read(path, '/phraseListSummary.txt');
    }

    read(path, file) {
        if (file == '/verbListFinite.txt') {
            var array = fs.readFileSync(path + file, 'utf8');
            array = array.split("\n");
            array.forEach(element => element = element.trim());
            return array;
        } else {
            var array = fs.readFileSync(path + file, 'utf8');
            array = eval("[" + array + "]");
            return array;
        }
    }

    get(dataset) {
        switch (dataset) {
            case "adjective":
                return this.adjectiveList;
            case "uposorgo":
                return this.uposorgoList;
            case "special character":
                return this.specialCharList;
            case "digit":
                return this.digitList;
                
            case "finite verb":
                return this.verbListFinite;
            case "proper noun":
                return this.nounListProper;
            case "kar":
                return this.karList;

            case "bivokti":
                return this.suffixListBivokti;
            case "collective noun suffix":
                return this.suffixListCollectiveNoun;
            case "material noun suffix":
                return this.suffixListMaterialNoun;
            case "number identifier":
                return this.suffixListNumberIdentifier;

            case "all suffix":
                return [
                    { "bivokti": this.suffixListBivokti },
                    { "collective noun suffix": this.suffixListCollectiveNoun },
                    { "material noun suffix": this.suffixListMaterialNoun },
                    { "number identifier": this.suffixListNumberIdentifier }
                ];

            case "summary phrase":
                return this.phraseListSummary;
            case "transition phrase":
                return this.phraseListTransition;

            case "all phrase":
                return [
                    { "summary phrase": this.phraseListSummary },
                    { "transition phrase": this.phraseListTransition },
                ];

            default:
                return null;
        }
    }
}

class Article {
    constructor(path, data) {
        this.data = data;
        this.raw = fs.readFileSync(path, 'utf8');
        this.paragraphs = this.parseParagraphs();

        this.terms = this.parseTerms();

        this.topicalTerms = this.selectTopicalTerms();

        this.compoundCandidates = this.selectCompoundCandidates();
        this.compoundTerms = this.getCompoundTerms(this.compoundCandidates);
        
        // For Testing Purpose //
        this.outputAllTerms();
        this.outputTopicalTerms();
        this.outputCompoundTerms();

    }

    getRaw() {
        return this.raw;
    }

    parseParagraphs() {
        var paragraphs = [];
        var index = 0;
        this.getRaw().split("\n").forEach(rawParagraph => {
            rawParagraph = rawParagraph.trim();
            if (rawParagraph) {
                paragraphs.push(new Paragraph(index, rawParagraph, data));
                index++;
            }
        });
        return paragraphs;
    }



    // TERM SEARCHING //

    parseTerms(){
        var terms = [];
        var termMaps = new Map();

        this.paragraphs.forEach(paragraph=>{
            paragraph.getSentences().forEach(sentence=>{
                sentence.getWords().forEach(word=>{
                    if(!termMaps[word.getRaw()]){
                        termMaps[word.getRaw()] = {
                            "raw": word.getRaw(),
                            "occurence": [word.getOccurence()],
                            "pwd": word.getOccurence().pwt
                        };
                        terms.push(word.getRaw());
                    } else{
                        termMaps[word.getRaw()].occurence.push(word.getOccurence());
                        termMaps[word.getRaw()].pwd+=word.getOccurence().pwt;
                    }
                })
            });
        });

        terms = terms.map(term=>termMaps[term]);
        return terms;
    }

    selectTopicalTerms(){
        var terms = this.terms;
        var maxPWD = -1;

        terms.forEach(term=>{
            if(term.pwd>maxPWD){
                maxPWD=term.pwd;
            }
        })
        
        // var sortedTerms = terms.sort(compareValues('pwd', 'desc'));
        var threshold = maxPWD / 6;
        var topicalTerms = [];

        for(let i=0; i<terms.length; i++){
            let term = terms[i];
            if (term.pwd > threshold) {
                topicalTerms.push(term);
            } 
        }

        return topicalTerms;
    }

    wordsToTerms(words){
        var terms = [];
        var termMaps = new Map();

        this.paragraphs.forEach(paragraph=>{
            paragraph.getSentences().forEach(sentence=>{
                sentence.getWords().forEach(word=>{
                    if(words.indexOf(word.getRaw()) != -1){
                        if(!termMaps[word.getRaw()]){
                            termMaps[word.getRaw()] = {
                                "raw": word.getRaw(),
                                "occurence": [word.getOccurence()],
                                "pwd": word.getOccurence().pwt
                            };
                            terms.push(word.getRaw());
                        } else{
                            termMaps[word.getRaw()].occurence.push(word.getOccurence());
                            termMaps[word.getRaw()].pwd+=word.getOccurence().pwt;
                        }
                    }
                })
            });
        });

        terms = terms.map(term=>termMaps[term]);
        return terms;
    }

    selectCompoundCandidates(){
        var previousCandidate=[];
        var nextCandidate=[];

        var previousTerms=[];
        var nextTerms=[];

        var previousWords = [];
        var nextWords = [];

        for(let i=0;i<this.topicalTerms.length;i++){
            let term = this.topicalTerms[i];
            previousWords[i] = [];
            nextWords[i] = [];
            term.occurence.forEach(position=>{
                let sentence = this.paragraphs[position.paragraph].getSentences()[position.sentence].getRaw().split(" ");
                let index = sentence.indexOf(term.raw);
                if(sentence[index-1]){
                    previousWords[i].push(sentence[index-1]);
                }
                if(sentence[index+1]){
                    nextWords[i].push(sentence[index+1]);
                }
            });
        }


        for(let i=0;i<this.topicalTerms.length;i++){
            if(previousWords[i]){
                previousTerms[i] = this.wordsToTerms(previousWords[i]);
                previousTerms[i].sort(compareValues('pwd', 'desc'));
                previousCandidate[i] = previousTerms[i][0];
            }
            if(nextWords[i]){
                nextTerms[i] = this.wordsToTerms(nextWords[i]);
                nextTerms[i].sort(compareValues('pwd', 'desc'));
                nextCandidate[i] = nextTerms[i][0];
            }
        }

        // this.outputTest(previousTerms);
        return {"previous": previousCandidate, "next": nextCandidate};
    }

    getCompoundTerms(compoundCandidates){
        var compoundTerms = [];
        for(let i=0;i<this.topicalTerms.length;i++){
            var threshold = this.topicalTerms[i].occurence.length/6;
            if(compoundCandidates.previous[i] && compoundCandidates.next[i]){
                if(compoundCandidates.previous[i].occurence.length > compoundCandidates.next[i].occurence.length){
                    if(compoundCandidates.previous[i].occurence.length>threshold){
                        compoundTerms.push({"topical": this.topicalTerms[i].raw, "compound":compoundCandidates.previous[i].raw + " " + this.topicalTerms[i].raw});
                    }
                } 

                else if(compoundCandidates.previous[i].occurence.length < compoundCandidates.next[i].occurence.length){
                    if(compoundCandidates.next[i].occurence.length>threshold){
                        compoundTerms.push({"topical":  this.topicalTerms[i].raw, "compound": this.topicalTerms[i].raw + " " + compoundCandidates.next[i].raw});
                    }
                } 

                else{
                    if(compoundCandidates.next[i].occurence.length>threshold){
                        compoundTerms.push({"topical":  this.topicalTerms[i].raw, "compound": compoundCandidates.previous[i].raw + " " +this.topicalTerms[i].raw + " " + compoundCandidates.next[i].raw});
                    }
                }
            } 
            else if(compoundCandidates.previous[i]){
                if(compoundCandidates.previous[i].occurence.length>threshold){
                    compoundTerms.push({"topical": this.topicalTerms[i].raw, "compound":compoundCandidates.previous[i].raw + " " + this.topicalTerms[i].raw});
                }
            } 
            else{
                if(compoundCandidates.next[i].occurence.length>threshold){
                    compoundTerms.push({"topical":  this.topicalTerms[i].raw, "compound": this.topicalTerms[i].raw + " " + compoundCandidates.next[i].raw});
                }
            }
        }
        return compoundTerms;
    }




    // For Testing Purpose //

    outputAllTerms(){
        var output ="";

        var index = 1;
        var output = "### ALL TERMS ###\n\n";
        this.terms.forEach(term => {
            output += "# " + index + "\n";
            output += "Term       : " + term.raw + "\n";
            output += "Occurence  : ";
            term.occurence.forEach(position=>output+="(" + position.paragraph + ", " + position.sentence+") ");
            output+="\n";
            output += "PWT        : ";
            term.occurence.forEach(position=>output+=position.pwt + " ");
            output+="\n";
            output += "PWD        : " + term.pwd + "\n\n";
            index++;
        });

        fs.writeFileSync("./data/output/allTerms.txt", output, "utf8");
    }

    outputTopicalTerms(){
        var output ="";

        var index = 1;
        var output = "### TOPICAL TERMS ###\n\n";
        this.topicalTerms.forEach(term => {
            output += "# " + index + "\n";
            output += "Term       : " + term.raw + "\n";
            output += "Occurence  : ";
            term.occurence.forEach(position=>output+="(" + position.paragraph + ", " + position.sentence+") ");
            output+="\n";
            output += "PWT        : ";
            term.occurence.forEach(position=>output+=position.pwt + " ");
            output+="\n";
            output += "PWD        : " + term.pwd + "\n\n";
            index++;
        });

        fs.writeFileSync("./data/output/topicalTerms.txt", output, "utf8");
    }
    
    outputCompoundTerms(){
        var output ="";

        var index = 1;
        var output = "### COMPOUND TERMS ###\n\n";
        this.compoundTerms.forEach(term => {
            output += "# " + index + "\n";
            output += "Term         : " + term.compound + "\n";
            output += "Topical      : " + term.topical + "\n\n";
            index++;
        });
        // this.compoundTerms.forEach(term => {
        //     output += "# " + index + "\n";
        //     output += "Term       : " + term.raw + "\n";
        //     output += "Occurence  : ";
        //     term.occurence.forEach(position=>output+="(" + position.paragraph + ", " + position.sentence+") ");
        //     output+="\n";
        //     output += "PWT        : ";
        //     term.occurence.forEach(position=>output+=position.pwt + " ");
        //     output+="\n";
        //     output += "PWD        : " + term.pwd + "\n\n";
        //     index++;
        // });

        fs.writeFileSync("./data/output/compoundTerms.txt", output, "utf8");
    }

    outputTest(terms){
        var output ="";
        var index = 1;
        var output = "### TERMS ###\n\n";
    
        for(let i=0; i<terms.length; i++){
            terms[i].forEach(term => {
                output += "# " + index + "\n";
                output += "Term       : " + term.raw + "\n";
                output += "Occurence  : ";
                term.occurence.forEach(position=>output+="(" + position.paragraph + ", " + position.sentence+") ");
                output+="\n";
                output += "PWT        : ";
                term.occurence.forEach(position=>output+=position.pwt + " ");
                output+="\n";
                output += "PWD        : " + term.pwd + "\n\n";
                index++;
            });
        }

        fs.writeFileSync("./data/test/testOut.txt", output, "utf8");
    }

    logParagraphs() {
        console.log(this.paragraphs);
    }

    log() {
        console.log(this);
    }
}

class Paragraph {
    constructor(index, raw, data) {
        this.index = index;
        this.raw = raw;
        this.data = data;

        this.length = this.getLength();
        this.weight = this.calculateWeight();

        this.sentences = this.parseSentences();
    }

    getRaw() {
        return this.raw;
    }

    parseSentences() {
        var sentences = [];
        var index = 0;
        this.getRaw().split("।").forEach(rawSentence => {
            rawSentence = rawSentence.trim();
            if (rawSentence) {
                sentences.push(new Sentence(index, rawSentence, {"index": this.index, "weight": this.weight}, this.data));
                index++;
            }
        });
        return sentences;
    }

    getFirstSentence(){
        var firstSentence;
        this.getRaw().split("।").forEach(sentence => {
            sentence = sentence.trim();
            if (sentence && !firstSentence) {
                firstSentence = sentence;
            }
        });
        return firstSentence;
    }

    getLength(){
        var index = 0;
        this.getRaw().split("।").forEach(sentence => {
            sentence = sentence.trim();
            if (sentence) {
                index++;
            }
        });
        return index;
    }

    calculateWeight() {
        var weight;
        var firstSentence = this.getFirstSentence();

        // Setting Title
        if (this.index == 0) {
            weight = 4;
        }

        // Setting Subtitle if any
        else if (this.index == 1 && this.length == 1) {
            weight = 3.5;
        }

        else {
            // Setting Leading or Conclusion
            this.data.get("summary phrase").forEach(phrase => {
                if (firstSentence.indexOf(phrase) == 0) {
                    weight = 3;
                }
            });

            // Setting Transition
            if (!weight) {
                this.data.get("transition phrase").forEach(phrase => {
                    if (firstSentence.indexOf(phrase) == 0) {
                        weight = 2;
                    }
                });
            }

            // Setting Others
            if (!weight) {
                weight = 1;
            }
        }

        return weight;
    }

    getSentences(){
        return this.sentences;
    }

    log() {
        console.log("index  : " + this.index);
        console.log("raw    : " + this.sentences[0].getRaw() + " ... ");
        console.log("length : " + this.length);
        console.log("weight : " + this.weight);
        console.log();
    }
}

class Sentence {
    constructor(index, raw, paragraph, data) {
        this.index = index;
        this.raw = raw;
        this.paragraph = paragraph;
        this.data = data;

        this.weight = this.calculateWeight();

        this.words = this.parseWords();
        this.length = this.words.length;
    }

    getRaw() {
        return this.raw;
    }

    parseWords() {
        var words = [];
        var index = 0;
        this.getRaw().split(" ").forEach(rawWord => {
            rawWord = rawWord.trim();
            if (rawWord) {
                words.push(new Word(index, rawWord, {"index": this.index, "weight": this.weight} , this.paragraph, data));
                index++;
            }
        });
        return words;
    }

    getLength(){
        return this.words.length;
    }

    calculateWeight() {
        var weight;

        // Setting Title
        if (this.paragraph.index == 0) {
            weight = 4;
        }

        // Setting Leading or Conclusion
        if (!weight) {
            this.data.get("summary phrase").forEach(phrase => {
                if (this.raw.indexOf(phrase) == 0) {
                    weight = 3;
                }
            });
        }

        // Setting Transition
        if (!weight) {
            this.data.get("transition phrase").forEach(phrase => {
                if (this.raw.indexOf(phrase) == 0) {
                    weight = 2;
                }
            });
        }

        // Setting Others
        if (!weight) {
            weight = 1;
        }

        return weight;
    }

    getWords(){
        return this.words;
    }

    log() {
        if (this.weight > 1) {
            console.log("index      :   " + this.paragraph.index + this.index);
            console.log("weight     :   " + this.weight);
            console.log();
            console.log();
        }
    }
}

class Word {
    constructor(index, raw, sentence, paragraph, data) {
        this.index = index;
        this.raw = raw;
        this.sentence = sentence;
        this.paragraph = paragraph;
        this.data = data;

        this.letters = this.parseLetters();
        this.length = this.letters.length;
        this.weight = this.calculateWeight();
        // this.log();
    }

    getRaw() {
        return this.raw;
    }

    parseLetters() {
        var letters = [];
        this.getRaw().split("").forEach(letter => letters.push(letter));
        return letters;
    }

    calculateWeight() {
        var weight;

        // Setting Words with Digits
        var digits = this.data.get("digit");
        for (let j = 0; j < digits.length; j++) {
            var digit = digits[j];

            if(this.raw.startsWith(digit)){
                weight = 1;
            } else if (this.raw.endsWith(digit) && !weight) {
                weight = 3;
            }
        }

        // Setting Others
        if (!weight) {
            weight = 1;
        }

        return weight;
    }

    getWeight(){
        return this.weight;
    }

    getOccurence(){
        return {
            "sentence":this.sentence.index,
            "paragraph":this.paragraph.index,
            "pwt":(this.weight * this.sentence.weight * this.paragraph.weight)
        };
    }

    log() {
        if(this.weight>1){
            console.log("index      :   " + this.paragraph + this.sentence + " " + this.index);
            console.log("weight     :   " + this.weight);
            console.log();
        }

        console.log(this.weight);
        console.log(this.paragraph.weight);
        console.log(this.sentence.weight);
    }
}

var data = new Data('./data');
var article = new Article('./data/input/article.txt', data);





// var raw = fs.readFileSync('./data/test/testIn.txt', 'utf8');
// raw = raw.replace(",", " ");
// raw = raw.replace("।", " ");
// raw = raw.replace("\n", " ");
// raw = raw.split(" ");

// raw = raw.map(element => element.trim());

// raw.forEach(element => {
//     data.getSuffixListBivokti().forEach(suffix => {
//         if(element.endsWith(suffix)){
//             var index = element.indexOf(suffix);
//             var elementArr = element.split("");

//             console.log(index);
//             console.log(element);
//             elementArr.splice(index, suffix.length);
//             element = elementArr.join("");
//             console.log(element);
//             console.log(suffix);
//             console.log();
//         }
//     });
// });


// console.log(raw);


// var trimmed = raw;
// fs.writeFileSync('./data/test/testOut.txt', trimmed, 'utf8');


/* Trie Data Structure */
// let Node = function() {
// 	this.keys = new Map();
// 	this.end = false;
// 	this.setEnd = function() {
// 		this.end = true;
// 	};
// 	this.isEnd = function() {
// 		return this.end;
// 	};
// };

// let Trie = function() {

// 	this.root = new Node();

// 	this.add = function(input, node = this.root) {
// 		if (input.length == 0) {
// 			node.setEnd();
// 			return;
// 		} else if (!node.keys.has(input[0])) {
// 			node.keys.set(input[0], new Node());
// 			return this.add(input.substr(1), node.keys.get(input[0]));
// 		} else {
// 			return this.add(input.substr(1), node.keys.get(input[0]));
// 		};
// 	};

// 	this.isWord = function(word) {
// 		let node = this.root;
// 		while (word.length > 1) {
// 			if (!node.keys.has(word[0])) {
// 				return false;
// 			} else {
// 				node = node.keys.get(word[0]);
// 				word = word.substr(1);
// 			};
// 		};
// 		return (node.keys.has(word) && node.keys.get(word).isEnd()) ? 
//       true : false;
// 	};

// 	this.print = function() {
// 		let words = new Array();
// 		let search = function(node, string) {
// 			if (node.keys.size != 0) {
// 				for (let letter of node.keys.keys()) {
// 					search(node.keys.get(letter), string.concat(letter));
// 				};
// 				if (node.isEnd()) {
// 					words.push(string);
// 				};
// 			} else {
// 				string.length > 0 ? words.push(string) : undefined;
// 				return;
// 			};
// 		};
// 		search(this.root, new String());
// 		return words.length > 0 ? words : mo;
// 	};

// };

// myTrie = new Trie()
// myTrie.add('ball'); 
// myTrie.add('bat'); 
// myTrie.add('doll'); 
// myTrie.add('dork'); 
// myTrie.add('do'); 
// myTrie.add('dorm')
// myTrie.add('send')
// myTrie.add('sense')
// console.log(myTrie.isWord('doll'))
// console.log(myTrie.isWord('dor'))
// console.log(myTrie.isWord('dorf'))
// console.log(myTrie.print());