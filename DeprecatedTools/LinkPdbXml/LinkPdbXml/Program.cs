using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Xml.Linq;
using PdbTypeParser;

namespace LinkPdbXml
{
    class Program
    {
        static XElement[] SplitDocItem(XElement docItem)
        {
            string name = docItem.Attribute("name").Value;
            if (name.StartsWith("F:"))
            {
                XElement[] summaries = docItem.Elements("summary").ToArray();
                if (summaries.Length != 1 || summaries[0].Value.Trim().StartsWith("[T:"))
                {
                    string fieldName = name.Substring(2);
                    XElement[] results = new XElement[summaries.Length];
                    for(int i=0;i<summaries.Length;i++)
                    {
                        var summary = summaries[i];
                        string text = summary.Value.Trim();
                        int index = text.IndexOf(']');
                        string type = text.Substring(3, index - 3);

                        name = "F:" + type + "." + fieldName;
                        text = text.Substring(index + 1);
                        results[i] = new XElement("member",
                            new XAttribute("name", name),
                            new XElement("summary", text)
                            );
                    }
                    return results;
                }
            }
            return new XElement[] { docItem };
        }

        static void Main(string[] args)
        {
            if (args.Length == 3)
            {
                Console.WriteLine("Parsing XMLs...");
                XDocument xmlPdb = XDocument.Load(args[0]);
                XDocument xmlDoc = XDocument.Load(args[1]);

                Console.WriteLine("Loading metadata from XMLs...");
                var udts = TypeDefinitions.LoadTypes(xmlPdb);
                var funcs = TypeDefinitions.LoadFunctions(udts, xmlPdb);
                var docItems = xmlDoc
                    .Root
                    .Elements("members")
                    .SelectMany(e => e.Elements("member").SelectMany(SplitDocItem))
                    .ToDictionary(e => e.Attribute("name").Value, e => e);

                Console.WriteLine("Matching document items with pdb symbols...");
                var matchedDocItems = docItems
                    .ToDictionary(p => p.Key, p => Tuple.Create(p.Value, DocItemProvider.FindSymbol(p.Value, udts, funcs)));

                Console.WriteLine("Writing merged xml documentation...");
                XElement merged = DocItemSerializer.Serialize(matchedDocItems, udts, funcs);
                XDocument xmlMerged = new XDocument(merged);
                xmlMerged.Save(args[2]);
            }
            else
            {
                Console.WriteLine("LinkPdbXml.exe <pdb-xml> <cpp-doc-xml> <output-doc-xml>");
            }
        }
    }
}
