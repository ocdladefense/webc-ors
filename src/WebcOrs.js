import HttpClient from "@ocdla/lib-http/HttpClient.js";
import Url from "@ocdla/lib-http/Url.js";
import {parseReferenceV1, ReferenceParser} from "@ocdladefense/ors/src/ReferenceParser.js";
import OrsChapter from "@ocdladefense/ors/src/Chapter.js";
import './mycss.css';


const ORS_ENDPOINT = "https://appdev.ocdla.org/books-online/index.php";

  

export default class WebcOrs extends HTMLDivElement {
  references = null;

  matrixes = null;

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
    let ref = this.getAttribute("ref") && this.getAttribute("ref").split(" ")[1];
    this.references = this.getAttribute("ref");
    this.useLabel = this.getAttribute("label") === "false";
    [this.chapterNumber, this.sectionNumber] = parseReferenceV1(ref);
    this.label = !!this.useLabel ? (this.references) : "";
    this.matrixes = ReferenceParser.toMatrix(this.getAttribute("ref").split(" ")[1]);
  }

  // Called each time the element is appended to the window/another element.
  connectedCallback() {
    let nodes = [];
    // let selectorString = this.selectors.join(",");
    const shadow = this.attachShadow({ mode: "open" });

    let styles = document.createElement("style");
    styles.innerText = WebcOrs.getCss();

    this.shadowRoot.appendChild(styles);

    WebcOrs.loadChapter(this.chapterNumber)
      .then((chapter) => {

        let selectors = chapter.toSelectors(this.matrixes);
        console.log("WEBC-ORS SELECTORS: ", selectors);
        return chapter.getNodes(selectors);
      })
      .then((fragments) => {

        let fragment = new DocumentFragment();
        let label = document.createElement("span");
        label.setAttribute("class", "section-label");

        // For multiple references, this should iterate to create separate labels and statutes.
        label.appendChild(document.createTextNode(this.label));
        if(this.useLabel) fragment.prepend(label);
        this.shadowRoot.appendChild(fragment);
        fragments.forEach((fragment) => {
          this.shadowRoot.appendChild(fragment);
        });
      })
      .catch((e) => {
        console.error(e);
      });

  }



  static loadChapter(chapterNumber) {

    // The cache should store a promise that resolves to an ORS Chapter object.
    return WebcOrs.cache[chapterNumber.toString()] ||  (function(chapterNumber) {

      const url = new Url("https://appdev.ocdla.org/books-online/index.php");
      url.buildQuery("chapter", chapterNumber.toString());

      const client = new HttpClient();
      const req = new Request(url.toString());
      const chapter = client.send(req)
      .then(resp => OrsChapter.fromResponse(resp, chapterNumber));
      
      WebcOrs.cache[chapterNumber.toString()] = chapter;
      return WebcOrs.cache[chapterNumber.toString()];
    })(chapterNumber);
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
        .section-label {
            padding: 5px;
            font-size:larger;
            font-weight: bold;
        }
        `;
  }
}

