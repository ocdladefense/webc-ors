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

  constructor() {
    super();
    let refs =
      this.getAttribute("references") &&
      this.getAttribute("references").split(" ")[1];
    this.references = refs.split(",").map((ref) => ref.trim());
    this.chapterNumber = "127"; //this.getAttribute("chapter");
    this.sectionNumber = "45"; //this.getAttribute("section");

    /*
        // console.log(this.references);
        if (null != this.references) {
            [this.chapterNumber, this.sectionNumber] = this.references[0].split(/\.|\(/);
            // console.log(this.chapterNumber, this.sectionNumber);
        } else {
            this.references = [[this.chapterNumber, this.sectionNumber].join(".")];
        }
        */
    // console.log(this.chapterNumber, this.sectionNumber);
  }

  // Called each time the element is appended to the window/another element.
  async connectedCallback() {
    let nodes = [];

    const shadow = this.attachShadow({ mode: "open" });

    let styles = document.createElement("style");
    styles.innerText = WebcOrs.getCss();

    try {
        nodes = await this.doSomething();
    } catch (e) {
        console.error(e);
        nodes.push(document.createTextNode("An error occurred: " + e.message));
    }
    // this.shadowRoot.appendChild(styles);

    this.shadowRoot.append(...nodes);
  }



  async doSomething() {
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
    


    let chapter = await WebcOrs.loadChapter(this.chapterNumber);
    let selector = "#section-" + this.sectionNumber;

    // Currently there is an issue because our source document has all kinds of nasty <html> tags in it.
    let sections = [chapter.doc.querySelector(selector)];
    
    if (null == sections) {
      throw new Error(
        "Could not retrieve section for " + this.references.join("\n")
      );
    }

    
    statute.prepend("I am appending some content here...");
    return [label, statute];//statute.append(...sections)];
  }

  static async loadChapter(chapterNumber) {
    const url = new Url("https://appdev.ocdla.org/books-online/index.php");

    url.buildQuery("chapter", chapterNumber.toString());

    const client = new HttpClient();
    const req = new Request(url.toString());
    const resp = await client.send(req);
    const msword = await OrsChapter.fromResponse(resp);
    msword.chapterNum = chapterNumber;
    return OrsChapter.toStructuredChapter(msword);
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

