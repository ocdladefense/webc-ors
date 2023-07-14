import { HttpClient } from "../node_modules/@ocdladefense/lib-http/HttpClient.js";
import { Url } from "../node_modules/@ocdladefense/lib-http/Url.js";

import { OrsApiMock } from "../dev_modules/lib-mock/ORSApiMock.js";
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

    constructor() {
        super();

        this.chapter = this.getAttribute("chapter");
        this.section = this.getAttribute("section");
    }

    // Called each time the element is appended to the window/another element
    async connectedCallback() {
        const shadow = this.attachShadow({ mode: "open" });

        const list = document.createElement("div");

        this.list = list;

        this.shadowRoot.append(list);

        const config = {};
        const client = new HttpClient(config);

        let url = WebcOrs.queryBySection(this.chapter, this.section);
        HttpClient.register("appdev.ocdla.org", new OrsApiMock());

        const req = new Request(url);

        const resp = await client.send(req);
        //wasn't working like this so went back to old way temporarily 
        //await client.send(req)
        resp.json()
            .then(sections => {

                if (sections.error) {
                    throw new Error(sections.message, { cause: sections });
                }
                console.log(sections);

                this.list.innerHTML = this.render(sections).join("\n");
            })
            .catch(error => {
                // alert('Error: ' + error.message);
                console.error(error);
                if (env.displayErrors && error.cause.code == "RANGE_EMPTY") { // Might help the customer.
                    this.list.innerHTML = "Free to Register";
                }
            });
    }

    static queryBySection(chapter, section = null) {
        // built-ins

        let url = ORS_ENDPOINT;
        url = new Url(url);
        url.buildQuery("chapter", chapter);
        url.buildQuery("section", section);
        url.buildQuery("TEST");

        return url.toString();
    }

    render(data) {
        // This is how we pass an identifier to map().
        return data.length == 0 ? "No Sections match those parameters" : data.map(this.renderSection);
    }

    renderSection(section, index) {

        return `<div key=${index}>
            <p>${section}</p>
        </div>`;
    }


}