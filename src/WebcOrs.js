import { HttpClient } from "../../lib-http/HttpClient.js";
import { Url } from "../../lib-http/Url.js";
import { OrsChapter } from "../../ors/dist/OrsChapter.js";
import { OrsApiMock } from "../../lib-mock/OrsApiMock.js";
export { WebcOrs };



const ORS_ENDPOINT = "https://appdev.ocdla.org/books-online/index.php";



class WebcOrs extends HTMLElement {

    reference;

    chapterNumber;

    sectionNumber = null;

    subSectionNumber = null;

    chapter = null;

    constructor() {
        super();
        this.reference = this.getAttribute("reference");
        this.chapterNumber = this.getAttribute("chapter");
        this.sectionNumber = this.getAttribute("section");
        //this.references = reference.split(",");
        if(null != this.reference) {
            let splitReference = this.reference.match(/([0-9a-zA-Z]+)/g);
            this.chapterNumber = splitReference.shift();
            this.sectionNumber = splitReference.shift();
            this.subSection = splitReference.join("-");
        } else {
            this.reference = [this.chapterNumber,this.sectionNumber].join(".");
        }

        console.log(this.chapterNumber, this.sectionNumber, this.subSection);
    }

    // Called each time the element is appended to the window/another element
    async connectedCallback() {
        const shadow = this.attachShadow({ mode: "open" });

        const list = document.createElement("div");
        list.setAttribute("class", "statute");
        const style = document.createElement("style");
        style.innerText = `
        .statute {
            font-family: monospace;
            border-left: 3px solid blue;
            margin-left: 50px;
            max-width: 50%;
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

        this.list = list;

        this.shadowRoot.append(style, list);

        const headers = new Headers();
        headers.append("Accept","text/html");
        const reqInit = {
            method: "GET",
            headers: headers,
            mode: "cors",
            cache: "default"
        };


        // const config = {};
        const client = new HttpClient();
        // client.toggleTest();
        let url = WebcOrs.OrsChapterQuery(this.chapterNumber);
        HttpClient.register("appdev.ocdla.org", new OrsApiMock());

        this.chapter = new OrsChapter(this.chapterNumber);

        // Make our http request and load the chapter from the Oregon Legislature website.
        const req = new Request(url);
        let resp = await client.send(req);
        await this.chapter.load(resp);
        this.chapter.init();

        let id = this.subSection ? [this.sectionNumber, this.subSection].join("-") : parseInt(this.sectionNumber);
        console.log(id);
        let html = await this.getSection(id);

        this.list.innerHTML = `<span class="section-label">${this.reference}</span>` + this.render(html);
    }



    async getSection(id) {
        const serializer = new XMLSerializer();

        let section = this.chapter.getSection(id);
        console.log(section);

        return serializer.serializeToString(section);
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




}

