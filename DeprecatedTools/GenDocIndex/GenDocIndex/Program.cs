using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.IO;

namespace GenDocIndex
{
    class Program
    {
        static void Main(string[] args)
        {
            if (args.Length >= 2)
            {
                string outputMethod = args[0];
                string outputTarget = Path.GetFullPath(args[1]) + "\\";
                string[] inputFiles = args.Skip(2)
                    .SelectMany(d => Directory.GetFiles(d))
                    .Select(f => Path.GetFullPath(f).ToUpper())
                    .Where(f => f.EndsWith(".DOCITEM.TXT"))
                    .Distinct()
                    .ToArray();

                DocItem[] docItems = inputFiles
                    .Select(f =>
                        {
                            try
                            {
                                List<string> errorLines = new List<string>();
                                DocItem result = DocItemParser.LoadDocItem(f, errorLines);
                                if (errorLines.Count > 0)
                                {
                                    Console.WriteLine("[{0}]:", f);
                                    foreach (var error in errorLines)
                                    {
                                        Console.WriteLine(error);
                                    }
                                }
                                return result;
                            }
                            catch (ArgumentException ex)
                            {
                                Console.WriteLine("[{0}]: {1}", f, ex.Message);
                                return null;
                            }
                        }
                    )
                    .Where(i => i != null)
                    .ToArray();
                try
                {
                    var mappedDocItems = DocItemSorter.MapItems(docItems);
                    var rootItems = DocItemSorter.SortAndGetRootItems(mappedDocItems);
                    var validationResult = DocItemValidator.Validate(docItems);
                    switch (outputMethod.ToUpper())
                    {
                        case "HTML":
                            StaticHtmlDocGenerator.GenerateStaticHtmlDocument(outputTarget, validationResult);
                            break;
                        case "META":
                            StaticMetaDocGenerator.GenerateStaticHtmlDocument(outputTarget, validationResult);
                            break;
                        default:
                            throw new ArgumentException(string.Format("Don't understand output method {0}.", outputMethod));
                    }
                }
                catch (ArgumentException ex)
                {
                    Console.WriteLine(ex.Message);
                    Console.WriteLine("Errors cause the index generatiing to stop.");
                }
            }
            else
            {
                Console.WriteLine("GenDocIndex.exe html <output-folder> <input-.docitem.txt-folder> ...");
            }
        }
    }
}
