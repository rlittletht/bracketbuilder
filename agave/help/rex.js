
var Rex =
{
    attachCollapsibles: function ()
    {
        var headings = document.getElementsByTagName("heading");
        var i;

        for (const heading of headings)
        {
            heading.addEventListener(
                "click",
                function (event)
                {
                    var section = event.target.parentElement;

                    var contents = section.getElementsByTagName("content");

                    if (contents.length > 0)
                    {
                        var content = contents[0];

                        event.target.classList.toggle("active");

                        if (content.style.display === "block" || content.style.display === "")
                        {
                            content.style.display = "none";
                        }
                        else
                        {
                            content.style.display = "block";
                        }
                    }
                });
        }
    },

    getHeadingFromSection: function(section)
    {
        for (const child of section.children)
            if (child.nodeName.toLowerCase() === "heading")
                return child;

        return null;
    },

    buildSection: function(node)
    {
        const children = [];

        for (const child of node.children)
            children.push(...this.buildSection(child));

        if (node.tagName.toLowerCase() === "section")
        {
            var section = {};

            const heading = this.getHeadingFromSection(node);
            if (heading)
                section.navText = heading.attributes["navText"]?.value ?? heading.innerText;
            else
                section.navText = null;

            if (node.hasAttribute("smallerNav"))
                section.smaller = true;

            section.id = node.id;
            section.children = children;
            return [section];
        }

        return children;
    },

    buildSectionsForAppendToNode: function (sections, smaller)
    {
        if (!sections?.length)
            return null;

        const ul = document.createElement("ul");

        if (smaller)
            ul.className = "smaller";

        for (const section of sections)
        {
            if (section.id && section.navText)
            {
                const li = document.createElement("li");
                const a = document.createElement("a");
                const text = document.createTextNode(section.navText);

                a.setAttribute("href", `#${section.id}`);
                a.appendChild(text);
                li.appendChild(a);
                ul.appendChild(li);

                const childSections = this.buildSectionsForAppendToNode(section.children, section.smaller);
                if (childSections)
                    ul.appendChild(childSections);
            }
        }

        return ul;
    },

    populateNavPane: function ()
    {
        // get our article id
        const articles = document.getElementsByTagName("article");
        const navs = document.getElementsByTagName("nav");

        if (!(articles?.length) || !(navs?.length))
            return;

        const article = articles[0];
        const nav = navs[0];

        const id = article.id;
        if (!id)
            return;

        const sections = this.buildSection(article);

        // find the matching nav item
        const links = nav.getElementsByTagName("a");
        for (const link of links)
        {
            if (link.href.endsWith(id))
            {
                // populate with our sections
                const li = link.parentElement;
                const ul = li.parentElement;

                if (li.tagName.toLowerCase() === "li" && ul.tagName.toLowerCase() === "ul")
                {
                    const newItems = this.buildSectionsForAppendToNode(sections, article.attributes["smallerNav"]);

                    if (newItems?.children?.length)
                    {
                        let newItem = newItems.children[0];

                        li.replaceWith(newItem);
                        // remember this is a live dom tree, so as we move the nodes to their final
                        // home, newItems children will get adjusted live

                        while (newItems.children.length > 0)
                        {
                            const newNewItem = newItems.children[0];

                            newItem.insertAdjacentElement("afterend", newNewItem);
                            newItem = newNewItem;
                        }
                    }
                }
                break; // don't get in an infinite loop...
            }
        }
    }
}

window.onload = function ()
{
    Rex.attachCollapsibles();
    Rex.populateNavPane();
};
