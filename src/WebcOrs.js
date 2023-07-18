import { HttpClient } from "~/node_modules/@ocdladefense/lib-http/HttpClient.js";
import { Url } from "~/node_modules/@ocdladefense/lib-http/Url.js";
import { OrsChapter } from "~/node_modules/@ocdladefense/ors/dist/chapter.js";
import { OrsApiMock } from "~/node_modules/@ocdladefense/lib-mock/ORSApiMock.js";
export { WebcOrs };

// Pretending what the current environment looks like for this machine/application.
const env = {
    today: "2023-06-30",
    season: "spring",
    weather: "mostly sunny",
    city: "Corvallis, OR",
    displayErrors: false, // We can imagine sceniors where we might *want to dipslay a message to the user.
};


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

        const config = {};
        const client = new HttpClient(config);

        let url = WebcOrs.queryBySection(this.chapter);
        HttpClient.register("appdev.ocdla.org", new OrsApiMock());

        const req = new Request(url);
        //some of this functionality should happen in HttpClient specifically HttpClient needs to cache responses using The HttpCache class
        let resp = await client.send(req);




        //wasn't working like this so went back to old way temporarily 
        //await client.send(req)
        if (resp.bodyUsed) {
            throw new Error("Go learn about body Used");
        }
        let html = await this.getSection(resp);

        this.list.innerHTML = this.render(html);

    }
    async getSection(resp) {
        const serializer = new XMLSerializer();

        let chapter = new OrsChapter(this.chapter);
        //resp = await client.send(req);
        let doc = await chapter.load(resp);

        if (!chapter.formatted) {
            chapter.parse();
            chapter.injectAnchors();
        }

        let startId = "section-" + parseInt(this.section);
        let endId = chapter.getNextSectionId(startId);
        console.log(endId);
        let cloned = chapter.cloneFromIds(startId, endId);
        let html = serializer.serializeToString(cloned);
        return html;
    }
    static queryBySection(chapter, section = null) {
        // built-ins

        let url = ORS_ENDPOINT;
        url = new Url(url);
        url.buildQuery("chapter", chapter);
        //url.buildQuery("section", section);

        return url.toString();
    }

    render(data) {
        // This is how we pass an identifier to map().
        return `<div>
        <p>${data}</p>
    </div>`;
    }

    renderSection(section, index) {


    }

    async fetchOrs(params) {

    }


}
window.WebcOrs = WebcOrs;