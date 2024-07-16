// const express = require('express');
// const app = express();
// const mammoth = require('mammoth');
// const fs = require('fs');
// const cheerio = require('cheerio');

// app.use(express.json());

// app.get("/", async (req, res) => {
//   res.send("Tanuja's home")
// })

// // Convert Word document from file to HTML with styles
// app.get('/convert', async (req, res) => {
//   try {
//     const filePath = './uploads/sample.docx';

//     const options = {
//       styleMap: [
//         "p[style-name='Heading 1'] => h1", // Mapping Word Heading 1 style to h1 tag
//         "p[style-name='Heading 2'] => h2", // Mapping Word Heading 2 style to h2 tag
//         "p[style-name='Normal'] => p", // Mapping Word Normal style to p tag
//         // "p => p" // Fallback to preserve other paragraph styles
//       ],
//       includeDefaultStyleMap: true,
//     };

//     const result = await mammoth.convertToHtml({ path: filePath }, options);

//     const html = result.value;

//     console.log('HTML content:', html); // Log the HTML content

//     fs.writeFile("./output.html", html, err => {
//       if (err) {
//         console.error(err);
//       } else {
//         console.log("Data written successfully")
//       }
//     });

//     const $ = cheerio.load(html);

//     const paragraphs = [];

//     // Extract paragraphs and their styles
//     $('p, h1, h2').each((index, element) => {
//       const content = $(element).text().trim();
//       let style = {};

//       // Infer styles based on the tag
//       if (element.tagName === 'h1') {
//         style = { 'font-size': '24px', 'font-weight': 'bold', 'type' : element.tagName }; // Example styles for Heading 1
//       } else if (element.tagName === 'h2') {
//         style = { 'font-size': '20px', 'font-weight': 'bold', 'type' : element.tagName  }; // Example styles for Heading 2
//       } else if (element.tagName === 'p') {
//         style = { 'font-size': '16px', 'font-weight': 'normal', 'type' : element.tagName  }; // Example styles for Paragraph
//       } else {
//         style = { 'font-size': '16px', 'font-weight': 'normal', 'type' : element.tagName  }; 
//       }

//       paragraphs.push({ content, style });
//     });

//     console.log('Extracted paragraphs:', paragraphs); // Log the extracted paragraphs

//     res.json(paragraphs);
//   } catch (error) {
//     console.error('Error:', error); // Log any errors that occur
//     res.status(500).json({ error: error.message });
//   }
// });

// app.listen(3000, () => {
//   console.log('Server is running on port 3000');
// });

const express = require('express');
const app = express();
const mammoth = require('mammoth');
const fs = require('fs');
const cheerio = require('cheerio');

app.use(express.json());

app.get("/", async (req, res) => {
  res.send("Tanuja's home")
})


// Convert Word document from file to HTML with styles
app.get('/convert', async (req, res) => {
  try {
    const filePath = './uploads/sample-file.docx';

    const options = {
      styleMap: [
        "p[style-name='Heading 1'] => h1",
        "p[style-name='Heading 2'] => h2",
        "p[style-name='Normal'] => p"
      ],
      includeDefaultStyleMap: true,
    };

    const result = await mammoth.convertToHtml({ path: filePath }, options);
    const html = result.value;

    fs.writeFile("./output.html", html, err => {
      if (err) {
        console.error(err);
      } else {
        console.log("Data written successfully")
      }
    });

    const $ = cheerio.load(html);

    const elements = [];
    let currentList = null; // Track the current list being processed

    // $('ul, ol').each((index, list) => {
    //   currentList = { type: list.tagName.toLowerCase(), items: [] };
    //   $(list).find('li').each((index, li) => {
    //     currentList.items.push($(li).text().trim());
    //   });
    //   elements.push(currentList);
    // });

    $('*').each((index, element) => {
      const tagName = element.tagName.toLowerCase();
      const content = $(element).text().trim();

      if (tagName != 'html' && tagName != "head" && tagName != "body") {
        if (tagName == 'a') {
          // console.log("Inside anchor tag")
          const id = element.attribs.id
          const link = element.attribs.href
          elements.push({ type: tagName, content, index, link, id });
        } if (tagName == 'img') {
          // console.log("Inside image tag")
          const id = element.attribs.id
          const src = element.attribs.src
          const alt = element.attribs.alt
          elements.push({ type: tagName, content, index, src, alt, id });
        }
        else if (tagName == 'table') {
          // console.log("Inside table tag")
          const id = element.attribs.id
          currentList = { type: element.tagName.toLowerCase(), items: [], id };

          $(element).find('tr').each((index, tr) => {
            let tdList = [];
            $(tr).find('td').each((index, td) => {
              tdList.push({
                type: $(tr).find('strong').length > 0 ? 'th' : 'td',
                content: $(td).text().trim(),
              });
            });
            currentList.items.push({
              type: "tr",
              items: tdList
            });
          });
          // Add elements other than lists to the elements array
          elements.push(currentList);
        }
        else if(tagName == 'ul' || tagName == 'ol') {
          console.log("Inside ul tag")
          const id = element.attribs.id
          currentList = { type: element.tagName.toLowerCase(), items: [], id };
          $(element).find('li').each((index, li) => {
            currentList.items.push($(li).text().trim());
          });
          // Add elements other than lists to the elements array
          elements.push(currentList);
        }
         else if (
          tagName !== 'ul' && 
          tagName !== 'ol' && 
         ['tbody', 'tr', 'th', 'td', 'a'].includes(tagName) == false &&
         ['tbody', 'tr', 'th', 'td'].includes(element.parent.tagName) == false &&
         ['tbody', 'tr', 'th', 'td'].includes(element.parent.parentNode.tagName) == false
        ) {
          // console.log("Inside last elsif")
          const id = element.attribs.id
          elements.push({ type: tagName, content, index, id });
        }
     

      }



    });
    fs.writeFile("./response.json", JSON.stringify(elements), err => {
      if (err) {
        console.error(err);
      } else {
        console.log("Data written successfully")
      }
    });
    // console.log('Extracted elements:', elements);
    res.json(elements);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
