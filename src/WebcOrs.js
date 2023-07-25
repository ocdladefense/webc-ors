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

        const myHeaders = new Headers({ 'Accept': 'text/html' });
        //myHeaders.append("Content-Type", "text/html")
        const reqInIt = {
            headers: myHeaders
        };

        const config = {};
        const client = new HttpClient(config);
        client.toggleTest();
        let url = WebcOrs.OrsChapterQuery(this.chapter);
        HttpClient.register("appdev.ocdla.org", new OrsApiMock());

        const req = new Request(url);
        const mockReq = new Request(url, reqInIt)

        let resp = await client.send(req);
        let html;

        html = await this.getSection(resp);



        this.list.innerHTML = this.render(html);
    }



    async getSection(resp) {
        const serializer = new XMLSerializer();

        let chapter = new OrsChapter(this.chapter);
        let doc = await chapter.load(resp);





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

