import fetch from "node-fetch";
import fs from "fs";
import commander from "commander";
import cliProgress from "cli-progress";

import packageJson from "../package.json";

interface Program extends commander.Command {
  readPath: string;
  writePath: string;
  bookshopAffiliate: string;
}

const program = new commander.Command(packageJson.name)
  .version(packageJson.version)
  .option("-r, --read-path <read-path>")
  .option("-w, --write-path <write-path>")
  .option(
    "-a, --bookshop-affiliate <bookshop-affiliate>",
    "Your bookshop affiliate ID."
  )
  .parse(process.argv) as Program;

interface Result {
  results: {
    converted_isbn: string;
    isbn: string;
  };
}

async function run() {
  const regex = /href="https:\/\/www.amazon.com\/gp\/product\/([0-9]*)\/.*?"/g;

  let content = fs.readFileSync(program.readPath, "utf8");
  const matches = [...content.matchAll(regex)];
  if (!matches.length) {
    console.log("No matches found in file.");
    return;
  }
  const progressBar = new cliProgress.SingleBar(
    {},
    cliProgress.Presets.shades_classic
  );
  progressBar.start(matches.length, 0);
  for (const match of matches) {
    progressBar.increment();
    const isbn10 = match[1];
    const convertUrl = new URL("https://www.isbn.org/xmljson.php");
    const params = {
      request_data: JSON.stringify({ isbn: isbn10 }),
      request_code: "isbn_convert",
    };
    convertUrl.search = new URLSearchParams(params).toString();
    const convertResponse = await fetch(convertUrl);
    const result: Result = await convertResponse.json();
    const upc = result.results.converted_isbn.replace(/-/g, "");
    const bookshopUrl = `https://bookshop.org/a/${program.bookshopAffiliate}/${upc}`;
    const bookshopResult = await fetch(bookshopUrl);
    if (bookshopResult.status === 404) {
      console.log(`\n\nCouldn't find isbn: ${isbn10} upc: ${upc} on bookshop`);
      continue;
    }
    content = content.replace(match[0], bookshopUrl);
  }
  progressBar.stop();

  console.log(`Writing to file ${program.writePath}.`);
  fs.writeFileSync(program.writePath, content, "utf8");
  console.log("Success!");
}

run();
