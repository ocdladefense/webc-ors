import { HttpClient } from "~/node_modules/@ocdladefense/lib-http/HttpClient.js";
import { Url } from "~/node_modules/@ocdladefense/lib-http/Url.js";
import { OrsChapter } from "~/node_modules/@ocdladefense/ors/dist/OrsChapter.js";
import { OrsApiMock } from "~/node_modules/@ocdladefense/lib-mock/OrsApiMock.js";
export { WebcOrs };



const ORS_ENDPOINT = "https://appdev.ocdla.org/books-online/index.php";



class WebcOrs extends HTMLElement {

    chapter;

    section = null;

    constructor(chapter = null, section = null) {
        super();

        this.chapter = chapter || this.getAttribute("chapter");
        this.section = section || this.getAttribute("section");
    }

    // Called each time the element is appended to the window/another element
    async connectedCallback() {
        const shadow = this.attachShadow({ mode: "open" });

        const list = document.createElement("div");

        this.list = list;

        this.shadowRoot.append(list);

        const myHeaders = new Headers({ 'Content-Type': 'text/html' });
        //myHeaders.append("Content-Type", "text/html")
        const reqInIt = {
            headers: myHeaders
        };

        const config = {};
        const client = new HttpClient(config);
        //client.toggleTest();
        let url = WebcOrs.OrsChapterQuery(this.chapter);
        HttpClient.register("appdev.ocdla.org", new OrsApiMock());

        const req = new Request(url, reqInIt);

        let resp = await client.send(req);
        let html;
        if (client.getLiveMode()) {
            html = await this.getSection(resp);
        }
        else {
            html = await resp.text();
        }


        this.list.innerHTML = this.render(html);
    }



    async getSection(resp) {
        const serializer = new XMLSerializer();

        let chapter = new OrsChapter(this.chapter);
        let doc = await chapter.load(resp);

        if (!chapter.formatted) {
            chapter.parse();
            chapter.injectAnchors();
        }

        let startId = "section-" + parseInt(this.section);
        let endId = chapter.getNextSectionId(startId);
        //console.log(endId);
        let cloned = chapter.cloneFromIds(startId, endId);
        let html = serializer.serializeToString(cloned);

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

