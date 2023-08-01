import { HttpClient } from "../../lib-http/HttpClient.js";
import { Url } from "../../lib-http/Url.js";
import { OrsChapter } from "../../ors/src/OrsChapter.js";
import { OrsParser } from "../../ors/src/OrsParser.js";
import { OrsApiMock } from "../../lib-mock/OrsApiMock.js";
export { WebcOrs };



const ORS_ENDPOINT = "https://appdev.ocdla.org/books-online/index.php";



class WebcOrs extends HTMLElement {

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
        this.references = this.getAttribute("references") && this.getAttribute("references").split(",").map((ref) => ref.trim());
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






    // Called each time the element is appended to the window/another element.
    async connectedCallback() {
        const shadow = this.attachShadow({ mode: "open" });

        const list = document.createElement("div");
        list.setAttribute("class", "statute");
        const style = document.createElement("style");
        style.innerText = WebcOrs.getCss();

        this.list = list;

        this.shadowRoot.append(style, list);

        const headers = new Headers();
        headers.append("Accept", "text/html");
        const reqInit = {
            method: "GET",
            headers: headers,
            mode: "cors",
            cache: "default"
        };

        const serializer = new XMLSerializer();

   
        const client = new HttpClient();
        // client.toggleTest();
        let url = WebcOrs.OrsChapterQuery(this.chapterNumber);
        HttpClient.register("appdev.ocdla.org", new OrsApiMock());

        

        // Make our http request and load the chapter from the Oregon Legislature website.
        const req = new Request(url);
        let resp = await client.send(req);

        this.chapter = await OrsChapter.fromCache(this.chapterNumber, resp);
        
        console.log(this.references);
        let sections = this.chapter.querySelectorAll(this.references);
        let htmlArray = (!sections || sections.length == 0) ? "Reference not found!" : [...sections].map((section) => serializer.serializeToString(section));
        console.log(htmlArray);

        this.list.innerHTML = "";
        for (var i = 0; i < htmlArray.length; i++) {
            let html = OrsParser.replaceAll(htmlArray[i]);
            this.list.innerHTML += `<span class="section-label">${this.references[i]}</span>` + this.render(html);
        }
    }






    static OrsChapterQuery(chapter) {

        let url = new Url(ORS_ENDPOINT);
        url.buildQuery("chapter", chapter);

        return url.toString();
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

