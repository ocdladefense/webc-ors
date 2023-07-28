import { HttpClient } from "~/node_modules/@ocdladefense/lib-http/HttpClient.js";
import { Url } from "~/node_modules/@ocdladefense/lib-http/Url.js";
import { OrsChapter } from "~/node_modules/@ocdladefense/ors/src/OrsChapter.js";
import { OrsApiMock } from "~/node_modules/@ocdladefense/lib-mock/OrsApiMock.js";
export { WebcOrs };



const ORS_ENDPOINT = "https://appdev.ocdla.org/books-online/index.php";



class WebcOrs extends HTMLElement {

    reference;

    chapter;

    section = null;

    subSection = null;

    constructor() {
        super();
        this.reference = this.getAttribute("reference");
        //this.references = reference.split(",");
        let splitReference = this.reference.match(/([0-9a-zA-Z]+)/g);
        this.chapter = splitReference.shift();
        this.section = splitReference.shift();
        this.subSection = splitReference.join("-");

        console.log(this.chapter, this.section, this.subSection);
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
        }`;

        this.list = list;

        this.shadowRoot.append(style, list);

        const myHeaders = new Headers({ 'Accept': 'text/html' });
        //myHeaders.append("Content-Type", "text/html")
        const reqInIt = {
            headers: myHeaders
        };

        const config = {};
        const client = new HttpClient(config);
        // client.toggleTest();
        let url = WebcOrs.OrsChapterQuery(this.chapter);
        HttpClient.register("appdev.ocdla.org", new OrsApiMock());

        const req = new Request(url);
        const mockReq = new Request(url, reqInIt)

        let resp = await client.send(req);
        let html;

        html = await this.getSection(resp);



        this.list.innerHTML = `<span>${this.reference}</span>` + this.render(html);
    }



    async getSection(resp) {
        const serializer = new XMLSerializer();



        let chapter = new OrsChapter(this.chapter);
        let doc = await chapter.load(resp);
        chapter.init();

        let section = chapter.getSection(parseInt(this.section) + "-" + this.subSection);
        // console.log(section);
        let html = serializer.serializeToString(section);


        return html;
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

