import HttpClient from "@ocdla/lib-http/HttpClient.js";
import Url from "@ocdla/lib-http/Url.js";
import {parseReferenceV1, parseChapterAndSection, parseSubsections, parseReferences, toSelectors} from "@ocdladefense/ors/src/ReferenceParser.js";
import OrsChapter from "@ocdladefense/ors/src/Chapter.js";
import './mycss.css';


const ORS_ENDPOINT = "https://appdev.ocdla.org/books-online/index.php";

  

export default class WebcOrs extends HTMLDivElement {
  references = null;

  // The ORS chapter to display.
  chapterNumber = null;

  // The chapter section to display.
  sectionNumber = null;

  // An array consisting of 0 or more subsections to display.
  subsections = null;

  chapter = null;

  // Used when labelling this section.
  label = null;

  static cache = {};



  constructor() {
    super();
    this.label = this.getAttribute("ref") && this.getAttribute("ref").split(" ")[1];
    this.useLabel = this.getAttribute("label") == "false" || true;
    [this.chapterNumber, this.sectionNumber] = parseReferenceV1(this.label);
    this.references = [[this.chapterNumber, this.sectionNumber].join(".")];
    this.selectors = toSelectors(this.label).map(sel => `[id*="${sel}"]`);
    console.log("WEBC-ORS SELECTORS: ", this.selectors);
  }

  // Called each time the element is appended to the window/another element.
  connectedCallback() {
    let nodes = [];
    let selectorString = this.selectors.join(",");
    const shadow = this.attachShadow({ mode: "open" });

    let styles = document.createElement("style");
    styles.innerText = WebcOrs.getCss();

    this.shadowRoot.appendChild(styles);

    WebcOrs.loadChapter(this.chapterNumber)
      .then((chapter) => {
        return chapter.querySelectorAll(selectorString);
      })
      .then((nodes) => {
        if (null == nodes || nodes.length == 0) {
          console.warn("No nodes were found for <webc-ors> (using "+selectorString+")");
          return;
        }
        let fragment = new DocumentFragment();
        let copies = nodes.map((node) => node.cloneNode(true));
        let label = document.createElement("span");

        label.setAttribute("class", "section-label");

        // For multiple references, this should iterate to create separate labels and statutes.
        label.appendChild(document.createTextNode(this.label));
        fragment.append(...copies);
        if(this.useLabel) fragment.prepend(label);
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
      const chapter = client.send(req).then(
        resp => OrsChapter.fromResponse(resp, chapterNumber) )
        .then( chapter => {
          // console.log(chapter.toString());
          return chapter;});

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
    label.appendChild(document.createTextNode(this.getAttribute("ref")));
    
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
        .level-4 {
            margin-left: 60px;
            margin-top: 5px;
            margin-bottom: 5px;
        }
        .level-5 {
            margin-left: 75px;
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

