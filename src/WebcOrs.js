import HttpClient from "@ocdla/lib-http/HttpClient.js";
import Url from "@ocdla/lib-http/Url.js";
import OrsChapter from "@ocdladefense/ors/src/Chapter.js";
import './mycss.css';


const ORS_ENDPOINT = "https://appdev.ocdla.org/books-online/index.php";



export default class WebcOrs extends HTMLDivElement {
  references;

  // The ORS chapter to display.
  chapterNumber;

  // The chapter section to display.
  sectionNumber = null;

  // An array consisting of 0 or more subsections to display.
  subsections = null;

  chapter = null;

  static cache = {};

  constructor() {
    super();
    let refs = this.getAttribute("ref") && this.getAttribute("ref").split(" ")[1];
    this.references = refs.split(",").map((ref) => ref.trim());
    // This ensures we get a chapter and a section even if the ref attribute contains subsection elements
    // of the form 138.001(1)(a).
    [this.chapterNumber, this.sectionNumber] = this.references[0].split(/\.|\(/).map(str => parseInt(str));
    this.references = [[this.chapterNumber, this.sectionNumber].join(".")];
  }

  // Called each time the element is appended to the window/another element.
  connectedCallback() {
    let nodes = [];

    const shadow = this.attachShadow({ mode: "open" });

    let styles = document.createElement("style");
    styles.innerText = WebcOrs.getCss();

    WebcOrs.loadChapter(this.chapterNumber)
      .then((chapter) => {

        return chapter.getDocumentNode();
      })
      .then(documentNode => {

        return [documentNode.getContentNode()];
        // let sections = [documentNode.getSection(this.sectionNumber)];
        // return sections;
      })
      .then((nodes) => {
        if (null == nodes) {
          throw new Error(
            "Could not retrieve section for " +
              [chapterNumber, sectionNumber].join(".")
          );
        }
        let fragment = new DocumentFragment();
        let copies = nodes.map((node) => node.cloneNode(true));
        fragment.append(...copies);
        this.shadowRoot.appendChild(fragment);
      })
      .catch((e) => {
        console.error(e);
        throw e;
        // nodes.push(document.createTextNode("An error occurred: " + e.message));
      });

  }



  static loadChapter(chapterNumber) {

    // If the promise that will eventually resolve to this 
    return WebcOrs.cache[chapterNumber.toString()] ||  (function(chapterNumber) {

      const url = new Url("https://appdev.ocdla.org/books-online/index.php");
      url.buildQuery("chapter", chapterNumber.toString());

      const client = new HttpClient();
      const req = new Request(url.toString());
      const chapter = client.send(req).then( resp => OrsChapter.fromResponse(resp, chapterNumber) )
        .then( chapter => {console.log(chapter.toString()); return chapter;});

      WebcOrs.cache[chapterNumber.toString()] = chapter;
      return WebcOrs.cache[chapterNumber.toString()];
    })(chapterNumber);
  }


  buildNode(sections) {
    let refHtml = [];
    let error = null;

    // Thee elements will be appended to the shodow DOM.
    let statute, label, styles;

    // We will display the statute text from the Oregon Legislature website;
    // and the label will be the ORS citation.
    // Add some styling as well.
    statute = document.createElement("div");
    label = document.createElement("span");
    
    
    statute.setAttribute("class", "statute");
    label.setAttribute("class", "section-label");

    // For multiple references, this should iterate to create separate labels and statutes.
    label.appendChild(document.createTextNode(this.references[0]));
    



    
    // statute.prepend("I am appending some content here...");
    statute.append(...sections);
    return [label, statute];
  }




  static getCss() {
    return `
        .subsection {
            display:inline-block;
            margin-top: 8px;
        }
        .statute {
            font-family: monospace;
            border-left: 3px solid blue;
            margin-left: 50px;
            max-width: 80%;
            padding-left: 20px;
        }
        .level-0 {
            margin-left: 0px;
            margin-top: 5px;
            margin-bottom: 5px;
        }

        .level-1 {
            margin-left: 15px;
            margin-top: 5px;
            margin-bottom: 5px;
        }

        .level-2 {
            margin-left: 30px;
            margin-top: 5px;
            margin-bottom: 5px;
        }

        .level-3 {
            margin-left: 45px;
            margin-top: 5px;
            margin-bottom: 5px;
        }
        .section-label:before {
            content: "ORS ";
        }
        .section-label {
            padding: 5px;
            font-size:larger;
            font-weight: bold;
        }
        `;
  }
}

