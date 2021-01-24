#!/usr/bin/env node

import fetch from "node-fetch";
import fs from "fs";
import commander from "commander";
import cliProgress from "cli-progress";
import amazonPaapi from "amazon-paapi";

import packageJson from "../package.json";

interface Program extends commander.Command {
  readPath: string;
  writePath: string;
  bookshopAffiliate?: string;
  amazonAccessKey?: string;
  amazonSecretKey?: string;
  amazonPartnerTag?: string;
}

const program = new commander.Command(packageJson.name)
  .version(packageJson.version)
  .option("-r, --read-path <read-path>")
  .option("-w, --write-path <write-path>")
  .option(
    "-a, --bookshop-affiliate [bookshop-affiliate]",
    "Your bookshop affiliate ID."
  )
  .option(
    "-c, --amazon-access-key [amazon-access-key]",
    "Your Amazon access key."
  )
  .option(
    "-s, --amazon-secret-key [amazon-secret-key]",
    "Your Amazon secret key."
  )
  .option(
    "-p, --amazon-partner-tag [amazon-partner-tag]",
    "Your Amazon partner tag."
  )
  .parse(process.argv) as Program;

interface Result {
  results: {
    converted_isbn: string;
    isbn: string;
  };
}

async function run() {
  let regex;
  if (program.bookshopAffiliate) {
    regex = /href="https:\/\/www.amazon.com\/gp\/product\/([0-9]*)\/.*?"/g;
  } else {
    regex = /href="https:\/\/bookshop.org\/a\/.*?\/([0-9]*?)"/g;
  }

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
    if (program.bookshopAffiliate) {
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
        console.log(
          `\n\nCouldn't find isbn: ${isbn10} upc: ${upc} on bookshop`
        );
        continue;
      }
      content = content.replace(match[0], `href="${bookshopUrl}"`);
    } else if (
      program.amazonAccessKey &&
      program.amazonSecretKey &&
      program.amazonPartnerTag
    ) {
      const upc = match[1];
      const commonParameters = {
        AccessKey: program.amazonAccessKey,
        SecretKey: program.amazonSecretKey,
        PartnerTag: program.amazonPartnerTag,
        PartnerType: "Associates", // Optional. Default value is Associates.
        Marketplace: "www.amazon.com", // Optional. Default value is US.
      };
      const requestParameters = {
        Keywords: upc,
        SearchIndex: "All",
        Resources: ["ItemInfo.Title"],
        Operation: "SearchItems",
      };
      const data = await amazonPaapi.SearchItems(
        commonParameters,
        requestParameters
      );
      if (!data.SearchResult?.Items || data.SearchResult.Items.length === 0) {
        console.log(`\n\nCouldn't find upc: ${upc} on Amazon`);
        continue;
      }
      const amazonAffiliateUrl = data.SearchResult.Items[0].DetailPageURL;
      content = content.replace(match[0], `href="${amazonAffiliateUrl}"`);
    }
  }
  progressBar.stop();

  console.log(`Writing to file ${program.writePath}.`);
  fs.writeFileSync(program.writePath, content, "utf8");
  console.log("Success!");
}

run();
