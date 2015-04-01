using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Xml.Linq;
using System.IO;

namespace GenXmlDocRef
{
    class Program
    {
        static void Main(string[] args)
        {
            if (args.Length == 3)
            {
                XDocument docXml = XDocument.Load(args[0]);
                string outputFolder = Path.GetFullPath(args[1]) + "\\";
                string rootUniqueId = args[2];

                var docRoot = DocItemAnalyzer.GetItems(docXml.Root);
                docRoot.UniqueId = rootUniqueId;
                Dictionary<string, DocItem> uniqueIdItemMap = new Dictionary<string, DocItem>();
                docRoot.BuildIndex(uniqueIdItemMap);

                Dictionary<string, DocItem> memberIdItemMap = new Dictionary<string, DocItem>();
                foreach (var docItem in uniqueIdItemMap.Values)
                {
                    if (docItem.Document != null)
                    {
                        string memberId = docItem.Document.Element("member").Attribute("name").Value;
                        docItem.Symbol = memberId;
                        memberIdItemMap.Add(memberId, docItem);
                    }
                }

                DocItemWriterContext context = new DocItemWriterContext();
                context.UniqueIdItemMap = uniqueIdItemMap;
                context.MemberIdItemMap = memberIdItemMap;
                context.UnknownPrimitiveTypes = new HashSet<string>();

                foreach (var docItem in uniqueIdItemMap.Values)
                {
                    string fileName = outputFolder + docItem.Name + ".docitem.txt";
                    try
                    {
                        using (StreamWriter writer = new StreamWriter(new FileStream(fileName, FileMode.Create), Encoding.UTF8))
                        {
                            docItem.Write(writer, context);
                        }
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine("{0}: {1}", docItem.Name, ex.Message);
                    }
                }

                using (StreamWriter writer = new StreamWriter(outputFolder + "_UnknownPrimitiveTypes.txt"))
                {
                    foreach (var type in context.UnknownPrimitiveTypes.OrderBy(s => s))
                    {
                        writer.WriteLine(type);
                    }
                }
                Console.WriteLine("All document items of reference {0} generated.", rootUniqueId);
                Console.WriteLine("All unknown primitive types are logged in \"_UnknownPrimitiveTypes.txt\".");
            }
            else
            {
                Console.WriteLine("GenXmlDocRef.exe <doc-xml> <out-folder> <root-unique-id>");
            }
        }
    }
}
