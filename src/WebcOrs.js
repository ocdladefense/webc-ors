import HttpClient from "@ocdla/lib-http/HttpClient.js";
import Url from "@ocdla/lib-http/Url.js";
import OrsChapter from "@ocdladefense/ors/src/OrsChapter.js";
import {OrsParser} from "@ocdladefense/ors/src/OrsParser.js";



const ORS_ENDPOINT = "https://appdev.ocdla.org/books-online/index.php";



export default class WebcOrs extends HTMLElement {

    references

    // The ORS chapter to display.
    chapterNumber;

    // The chapter section to display.
    sectionNumber = null;

    // An array consisting of 0 or more subsections to display.
    subsections = null;

    chapter = null;




    constructor() {
        super();
        let refs = this.getAttribute("references") && this.getAttribute("references").split(" ")[1];
        this.references = refs.split(",").map((ref) => ref.trim());
        this.chapterNumber = this.getAttribute("chapter");
        this.sectionNumber = this.getAttribute("section");

        // console.log(this.references);
        if (null != this.references) {
            [this.chapterNumber, this.sectionNumber] = this.references[0].split(/\.|\(/);
            // console.log(this.chapterNumber, this.sectionNumber);
        } else {
            this.references = [[this.chapterNumber, this.sectionNumber].join(".")];
        }

        // console.log(this.chapterNumber, this.sectionNumber);
    }


    static async loadChapter(chapterNumber) {

        const url = new Url("https://appdev.ocdla.org/books-online/index.php");
        url.buildQuery("chapter", chapterNumber.toString());

        const req = new Request(url.toString());
        console.log(req);
        const client = new HttpClient();
        const resp = await client.send(req);
        console.log(resp);
        console.log("loading chapter");
        const msword = OrsChapter.fromResponse(resp.clone());
        msword.chapterNum = chapterNumber;

        // console.log(msword);

        return OrsChapter.toStructuredChapter(msword);
    }



    // Called each time the element is appended to the window/another element.
    async connectedCallback() {
        const shadow = this.attachShadow({ mode: "open" });

        const list = document.createElement("div");
        list.setAttribute("class", "statute");
        const style = document.createElement("style");
        style.innerText = WebcOrs.getCss();

        const serializer = new XMLSerializer();

        this.chapter = await WebcOrs.loadChapter(this.chapterNumber);
        

        console.log(this.references);
        

        let refHtml = [];
        let error = null;

        try {
            let sections = this.chapter.querySelectorAll(this.references);
            if(null == sections) {
                throw new Error("Could not retrieve section for "+this.references.join("\n"));
            }
            let htmlArray = (!sections || sections.length == 0) ? "Reference not found!" : [...sections].map((section) => serializer.serializeToString(section));

            console.log(htmlArray);

            for (var i = 0; i < htmlArray.length; i++) {
                let html = OrsParser.replaceAll(htmlArray[i]);
                refHtml.push(`<span class="section-label">${this.references[i]}</span>` + this.render(html));
            }
        } catch(e) {
            error = e.message;
            console.error(e);
        }
        
        console.log(this);
        list.innerHTML = null != error ? error : refHtml.join("\n");

        this.shadowRoot.append(style, list);
    }





    render(data) {
        return `<div>
            <p>${data}</p>
        </div>`;
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

