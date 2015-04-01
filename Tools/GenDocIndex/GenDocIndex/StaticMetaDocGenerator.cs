using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.IO;
using System.Web;
using System.Xml.Linq;

namespace GenDocIndex
{
    static class StaticMetaDocGenerator
    {
        static void GenerateText(TextWriter writer, string content)
        {
            HttpUtility.HtmlEncode(content, writer);
        }

        static string GetKey(DocItem docItem)
        {
            return docItem.UniqueId.Replace(':', '_').Replace('.', '_');
        }

        static IEnumerable<XElement> GenerateIndexTree(IEnumerable<DocItem> docItemSiblings, List<DocItem> parentList, int parentIndex, int level)
        {
            foreach (var sibling in docItemSiblings.OrderBy(d => d.Title))
            {
                bool needHyperlink =
                    !(
                        parentIndex < parentList.Count &&
                        sibling == parentList[parentIndex] &&
                        parentIndex == parentList.Count - 1
                    );
                yield return new XElement(
                    "indexNode",
                    new XElement("level", level),
                    new XElement("title", sibling.Title),
                    new XElement("uniqueId", GetKey(sibling)),
                    new XElement("link", needHyperlink)
                    );
                if (parentIndex < parentList.Count && sibling == parentList[parentIndex])
                {
                    var subItems = GenerateIndexTree(sibling.SubItems, parentList, parentIndex + 1, level + 1);
                    foreach (var subItem in subItems)
                    {
                        yield return subItem;
                    }
                }
            }
        }

        static void GenerateContent(XElement xmlRoot, DocItem docItem, DocItemValidationResult validationResult)
        {
            {
                List<DocItem> parentList = new List<DocItem>();
                {
                    DocItem currentItem = docItem;
                    while (currentItem != null)
                    {
                        parentList.Insert(0, currentItem);
                        currentItem = currentItem.Parent;
                    }
                }
                xmlRoot.Add(new XElement("indexTree", GenerateIndexTree(validationResult.RootItems, parentList, 0, 0).ToArray()));
            }
            var writer = new StringWriter();
            {
                StaticHtmlDocGenerator.GenerateDocumentContent(writer, docItem, validationResult, d => string.Format("$UNIQUEIDLINK({0})", GetKey(d)));
            }
            string content = writer.ToString();
            xmlRoot.Add(new XElement("content", content));
        }

        static void GenerateFile(DocItem docItem, string outputFolder, DocItemValidationResult validationResult)
        {
            string fileName = outputFolder + GetKey(docItem) + ".xml";
            using (StreamWriter writer = new StreamWriter(new FileStream(fileName, FileMode.Create, FileAccess.Write), Encoding.UTF8))
            {
                XDocument xmlMeta = new XDocument();
                xmlMeta.Add(new XElement("metaDoc"));
                XElement xmlRoot = xmlMeta.Root;
                xmlRoot.Add(new XElement("title", docItem.Title));
                xmlRoot.Add(new XElement("uniqueId", GetKey(docItem)));
                if (docItem.Parent != null)
                {
                    xmlRoot.Add(new XElement("parentUniqueId", GetKey(docItem.Parent)));
                }
                xmlRoot.Add(new XElement("subItems", docItem.SubItems.Select(d => new XElement("subItem", GetKey(d))).ToArray()));
                GenerateContent(xmlRoot, docItem, validationResult);
                xmlMeta.Save(writer);
            }
            GenerateFiles(docItem.SubItems, outputFolder, validationResult);
        }

        static void GenerateFiles(IEnumerable<DocItem> docItems, string outputFolder, DocItemValidationResult validationResult)
        {
            foreach (var item in docItems.OrderBy(i => i.Title))
            {
                GenerateFile(item, outputFolder, validationResult);
            }
        }

        public static void GenerateStaticHtmlDocument(string outputFolder, DocItemValidationResult validationResult)
        {
            GenerateFiles(validationResult.RootItems, outputFolder, validationResult);
        }
    }
}
