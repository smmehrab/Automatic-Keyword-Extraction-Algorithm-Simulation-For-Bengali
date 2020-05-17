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
    constructor(path) {
        // Reading Article from File
        this.raw = fs.readFileSync(path, 'utf8');
        
        // Initializing the Structure Recursively : Paragraphs > Sentences > Words > Letters
        this.paragraphHead = this.paragraphLinkedList();
        this.paragraphs = this.paragraphArray(this.paragraphHead);

        // Performing Calculations - Core Algorithm
        this.terms = this.calculateTerms();
        this.topicalTerms = this.calculateTopicalTerms(this.terms);
        this.compoundCandidates = this.calculateCompoundCandidates(this.topicalTerms);
        this.compoundTerms = this.calculateCompoundTerms(this.compoundCandidates);
        
        // OUTPUT //
        this.outputAllTerms();
        this.outputTopicalTerms();
        this.outputCompoundTerms();
    }

    getRaw() {
        return this.raw;
    }

    getParagraphHead(){
        return this.paragraphHead;
    }

    getParagraphs(){
        this.paragraphs;
    }

    paragraphLinkedList(index=0, head=null, paragraphHead=null) {
        this.getRaw().split("\n").forEach(rawParagraph => {
            rawParagraph = rawParagraph.trim();
            if (rawParagraph) {
                if(!head){
                    head = new Paragraph(index, rawParagraph, this);
                    paragraphHead = head;
                } else{
                    head.next = new Paragraph(index, rawParagraph, this);
                    head.next.previous = head;
                    head = head.next;
                }
                index++;
            }
        });
        return paragraphHead;
    }

    paragraphArray(head, paragraphs = []){
        while(head){
            paragraphs.push({
                "index":head.getIndex(),
                "raw": head.getRaw(),
                "weight":head.getWeight(),
                "length": head.getLength(),
                "sentences": head.getSentences()
            });
            head = head.next;
        }
        return paragraphs;        
    }


    /*********** CALCULATIONS *************/
    calculateTerms(terms=[], termMaps = new Map(), paragraphHead = this.getParagraphHead()){
        // Iterating 3 Levels of Our Tree-Like Linked List to Access Every Leaf Node (Word)
        while(paragraphHead){
            var sentenceHead = paragraphHead.getSentenceHead();
            while(sentenceHead){
                var wordHead = sentenceHead.getWordHead();
                while(wordHead){
                    // Word - The First Time
                    if(!termMaps[wordHead.getRaw()]){
                        termMaps[wordHead.getRaw()] = {
                            "raw"                       :   wordHead.getRaw(),
                            "frequency"                 :   1,
                            "positions"                 :   [wordHead.getPosition()],
                            "positionWeights"           :   [wordHead.getPositionWeight()],
                            "positionaWeightDocument"   :   wordHead.getPositionWeight(),
                            "previous"                  :   [wordHead.previous],
                            "next"                      :   [wordHead.next]              
                        };
                        terms.push(wordHead.getRaw());
                    } 
                    // Word - Appeared Before
                    else{
                        termMaps[wordHead.getRaw()].frequency++;
                        termMaps[wordHead.getRaw()].positions.push(wordHead.getPosition());
                        termMaps[wordHead.getRaw()].positionWeights.push(wordHead.getPositionWeight());
                        termMaps[wordHead.getRaw()].positionaWeightDocument += wordHead.getPositionWeight();
                        termMaps[wordHead.getRaw()].previous.push(wordHead.previous),
                        termMaps[wordHead.getRaw()].next.push(wordHead.next)
                    }
                    
                    wordHead = wordHead.next;
                }
                sentenceHead = sentenceHead.next;
            }
            paragraphHead = paragraphHead.next;
        }

        terms = terms.map(term=>termMaps[term]);
        return terms;
    }

    calculateTopicalTerms(terms, maxPositionaWeightDocument=-1, topicalTerms=[]){
        terms.forEach(term=>{
            if(term.positionaWeightDocument > maxPositionaWeightDocument){
                maxPositionaWeightDocument = term.positionaWeightDocument;
            }
        });
        
        var thresholdPositionWeightDocument = maxPositionaWeightDocument / 6;
        terms.forEach(term=>{
            if(term.positionaWeightDocument > thresholdPositionWeightDocument){
                topicalTerms.push(term);
            }
        });

        return topicalTerms;
    }

    calculateCompoundCandidates(topicalTerms, index=0, compoundCandidates=[]){
        topicalTerms.forEach(topicalTerm=>{
            var previous, next, previousCooccurrence, nextCooccurrence;
            if(topicalTerm.previous.length>0){
                topicalTerm.previous.forEach(candidate=>{
                    if(candidate){
                        if(!previous){
                            previous = candidate;
                            previousCooccurrence=1;
                        }
                        else if(previous.getRaw() == candidate.getRaw()){
                            previousCooccurrence+=1;
                        }
                        else if(previous.positionaWeightDocument < candidate.positionaWeightDocument){
                            previous = candidate;
                            previousCooccurrence=1;
                        }
                    }
                });
            }

            if(topicalTerm.next.length>0){
                topicalTerm.next.forEach(candidate=>{
                    if(candidate){
                        if(!next){
                            next = candidate;
                            nextCooccurrence=1;
                        }
                        else if(next.getRaw()==candidate.getRaw()){
                            nextCooccurrence+=1;
                        }
                        else if(next.positionaWeightDocument < candidate.positionaWeightDocument){
                            next = candidate;
                            nextCooccurrence=1;
                        }
                    }
                });
            }

            compoundCandidates[index]={"previous": {"term": previous, "cooccurrence": previousCooccurrence}, "next": {"term": next, "cooccurrence": nextCooccurrence}};            
            index++;            
        });

        return compoundCandidates;
    }

    calculateCompoundTerms(compoundCandidates, compoundTerms = []){
        for(let i=0;i<this.topicalTerms.length;i++){
            var threshold = this.topicalTerms[i].positions.length/6;
            
            if(compoundCandidates[i].previous.cooccurrence>threshold){
                var alreadyIncluded = false;
                var compoundWord = compoundCandidates[i].previous.term.raw +" "+ this.topicalTerms[i].raw;
                compoundTerms.forEach(term=>{
                   if(term.raw == compoundWord){
                       alreadyIncluded=true;
                   } 
                });
                if(!alreadyIncluded){
                    compoundTerms.push({"topical": this.topicalTerms[i], "compound": compoundCandidates[i].previous.term, "raw": compoundWord});
                }
            }

            if(compoundCandidates[i].next.cooccurrence>threshold){
                var alreadyIncluded = false;
                var compoundWord = this.topicalTerms[i].raw +" "+ compoundCandidates[i].next.term.raw;
                compoundTerms.forEach(term=>{
                    if(term.raw == compoundWord){
                        alreadyIncluded=true;
                    } 
                 });
                if(!alreadyIncluded){
                    compoundTerms.push({"topical": this.topicalTerms[i], "compound": compoundCandidates[i].next.term, "raw": compoundWord})
                }
            }
        }
        return compoundTerms;
    }


    // OUTPUT //
    outputAllTerms(terms = this.terms, output = "### ALL TERMS ###\n\n", index = 1){
        terms.forEach(term => {
            output += "Index                    : " + index + "\n";
            output += "Term                     : " + term.raw + "\n";
            output += "Frequency                : " + term.frequency + "\n";
            output += "Positions                : ";
            term.positions.forEach(position=>{
                output+= position.paragraph + ":" + position.sentence + ":" + position.word + " ";
            });
            output+="\n";
            output += "Position Weights         : " + term.positionWeights + "\n";
            output += "Position Weight Document : " + term.positionaWeightDocument + "\n\n";
            index++;
        });
        fs.writeFileSync("./data/output/allTerms.txt", output, "utf8");
    }

    outputTopicalTerms(terms = this.topicalTerms, output = "### TOPICAL TERMS ###\n\n", index = 1){
        terms.forEach(term => {
            output += "Index                    : " + index + "\n";
            output += "Term                     : " + term.raw + "\n";
            output += "Frequency                : " + term.frequency + "\n";
            output += "Positions                : ";
            term.positions.forEach(position=>{
                output+= position.paragraph + ":" + position.sentence + ":" + position.word + " ";
            });
            output+="\n";
            output += "Position Weights         : " + term.positionWeights + "\n";
            output += "Position Weight Document : " + term.positionaWeightDocument + "\n\n";
            index++;
        });
        fs.writeFileSync("./data/output/topicalTerms.txt", output, "utf8");
    }

    outputCompoundTerms(terms = this.compoundTerms, output = "### COMPOUND TERMS ###\n\n", index = 1){
        terms.forEach(term => {
            output += "Index                    : " + index + "\n";
            output += "Term                     : " + term.raw + "\n";
            output += "Topical                  : " + term.topical.raw + "\n";
            output += "Compound                 : " + term.compound.raw + "\n\n";
            index++;
        });
        fs.writeFileSync("./data/output/compoundTerms.txt", output, "utf8");
    }
}

class Paragraph {
    constructor(index, raw, parent) {
        this.index = index;
        this.raw = raw;
        
        this.parent = parent;
        this.previous = null;
        this.next = null;

        this.weight = this.calculateWeight();

        this.sentenceHead = this.sentenceLinkedList();
        this.sentences = this.sentenceArray(this.sentenceHead);
    }

    getIndex(){
        return this.index;
    }

    getRaw() {
        return this.raw;
    }

    getLength(){
        return this.length;
    }

    getSentenceHead(){
        return this.sentenceHead;
    }

    getWeight(){
        return this.weight;
    }

    getPositionWeight(){
        return this.weight;
    }
    
    getSentences(){
        return this.sentences;
    }

    getParent(){
        return this.parent;
    }

    getFirstSentence(firstSentence = null){
        this.getRaw().split("।").forEach(rawSentence => {
            rawSentence = rawSentence.trim();
            if (rawSentence) {
                firstSentence = rawSentence;
            }
        });
        return firstSentence;
    }

    calculateWeight(weight = null, firstSentence = this.getFirstSentence()) {
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
            data.get("summary phrase").forEach(phrase => {
                if (firstSentence.indexOf(phrase) == 0) {
                    weight = 3;
                }
            });

            // Setting Transition
            if (!weight) {
                data.get("transition phrase").forEach(phrase => {
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

    sentenceLinkedList(index=0, head=null, sentenceHead=null) {
        this.getRaw().split("।").forEach(rawSentence => {
            rawSentence = rawSentence.trim();
            if (rawSentence) {
                if(!head){
                    head = new Sentence(index, rawSentence, this);
                    sentenceHead = head;
                } else{
                    head.next = new Sentence(index, rawSentence, this);
                    head.next.previous = head;
                    head = head.next;
                }
                index++;
            }
        });
        this.length = index;
        return sentenceHead;
    }

    sentenceArray(head, sentences = []){
        while(head){
            sentences.push({
                "index"     : head.getIndex(),
                "raw"       : head.getRaw(),
                "weight"    : head.getWeight(),
                "length"    : head.getLength(),
                "sentences" : head.getWords()
            });
            head = head.next;
        }
        return sentences;        
    }
}

class Sentence {
    constructor(index, raw, parent) {
        this.index = index;
        this.raw = raw;

        this.parent = parent;
        this.previous = null;
        this.next = null;

        this.weight = this.calculateWeight();

        this.wordHead = this.wordLinkedList();
        this.words = this.wordArray(this.wordHead);
    }

    getIndex(){
        return this.index;
    }

    getRaw() {
        return this.raw;
    }

    getLength(){
        return this.length;
    }

    getWeight(){
        return this.weight;
    }

    getPositionWeight(){
        return (this.getWeight() * this.getParent().getPositionWeight());
    }

    getWords(){
        return this.words;
    }

    getWordHead(){
        return this.wordHead;
    }

    getParent(){
        return this.parent;
    }
    
    calculateWeight(weight=null) {
        // If Title Sentence
        if (this.parent.getIndex() == 0) {
            weight = 4;
        }

        // If Leading or Conclusion Sentence
        if (!weight) {
            data.get("summary phrase").forEach(phrase => {
                if (this.raw.indexOf(phrase) == 0) {
                    weight = 3;
                }
            });
        }

        // If Transition Sentence
        if (!weight) {
            data.get("transition phrase").forEach(phrase => {
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

    wordLinkedList(index=0, head=null, wordHead=null) {
        this.getRaw().split(" ").forEach(rawWord => {
            rawWord = rawWord.trim();
            if (rawWord) {
                if(!head){
                    head = new Word(index, rawWord, this);
                    wordHead = head;
                } else{
                    head.next = new Word(index, rawWord, this);
                    head.next.previous = head;
                    head = head.next;
                }
                index++;
            }
        });
        this.length = index;
        return wordHead;
    }

    wordArray(head, words = []){
        while(head){
            words.push({
                "index"             : head.getIndex(),
                "raw"               : head.getRaw(),
                "positionWeight"    : head.getPositionWeight(),
                "weight"            : head.getWeight(),
                "length"            : head.getLength(),
                "letters"           : head.getLetters()
            });
            head = head.next;
        }
        return words;        
    }
}

class Word {
    constructor(index, raw, parent) {
        this.index = index;
        this.raw = raw;

        this.parent = parent;
        this.previous = null;
        this.next = null;

        this.weight = this.calculateWeight();

        this.letterHead = this.letterLinkedList();
        this.letters = this.letterArray(this.letterHead);
    }

    getIndex(){
        return this.index;
    }

    getRaw(){
        return this.raw;
    }

    getWeight(){
        return this.weight;
    }

    getPositionWeight(){
        return (this.getWeight() * this.getParent().getPositionWeight());
    }

    getLength(){
        return this.length;
    }

    getLetters(){
        return this.letters;
    }

    getParent(){
        return this.parent;
    }

    getPosition(){
        return {
            "paragraph" : this.getParent().getParent().getIndex(),
            "sentence"  : this.getParent().getIndex(),
            "word"      : this.getIndex()
        };
    }

    calculateWeight(weight=null) {
        // If Word includes Digits
        var digits = data.get("digit");
        for (let j = 0; j < digits.length; j++) {
            var digit = digits[j];
            if(this.getRaw().startsWith(digit)){
                weight = 1;
            } else if (this.getRaw().endsWith(digit) && !weight) {
                weight = 3;
            }
        }

        // Others
        if (!weight) {
            weight = 1;
        }

        return weight;
    }

    letterLinkedList(index=0, head=null, letterHead=null) {
        this.getRaw().split("").forEach(rawLetter => {
            if (rawLetter) {
                if(!head){
                    head = new Letter(index, rawLetter, this);
                    letterHead = head;
                } else{
                    head.next = new Letter(index, rawLetter, this);
                    head.next.previous = head;
                    head = head.next;
                }
                index++;
            }
        });
        this.length = index;
        return letterHead;
    }

    letterArray(head, letters = []){
        while(head){
            letters.push({
                "index"     : head.getIndex(),
                "raw"       : head.getRaw(),
            });
            head = head.next;
        }
        return letters;        
    }
}

class Letter{
    constructor(index, raw, parent){
        this.index = index;
        this.raw = raw;
        
        this.parent = parent;
        this.previous = null;
        this.next = null;
    }

    getIndex(){
        return this.index;
    }

    getRaw(){
        return this.raw;
    }
}

var data = new Data('./data');
var article = new Article('./data/input/article.txt');




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