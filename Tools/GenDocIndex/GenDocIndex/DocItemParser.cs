using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.IO;

namespace GenDocIndex
{
    class DocItem
    {
        public string Title { get; set; }
        public string UniqueId { get; set; }
        public string ParentUniqueId { get; set; }
        public string Symbol { get; set; }
        public DocNode Content { get; set; }

        public DocItem Parent { get; set; }
        public List<DocItem> SubItems { get; private set; }

        public DocItem()
        {
            this.SubItems = new List<DocItem>();
        }

        public override string ToString()
        {
            return this.UniqueId;
        }
    }

    static class DocItemParser
    {
        public static DocItem LoadDocItem(string fileName, List<string> errorLines)
        {
            using (StreamReader reader = new StreamReader(fileName))
            {
                DocItem docItem = new DocItem();
                bool enterContentMode = false;
                List<string> contentLines = new List<string>();
                while (!reader.EndOfStream)
                {
                    string line = reader.ReadLine();
                    if (line.StartsWith("/title:"))
                    {
                        int index = line.IndexOf(':');
                        docItem.Title = line.Substring(index + 1);
                    }
                    else if (line.StartsWith("/uniqueId:"))
                    {
                        int index = line.IndexOf(':');
                        docItem.UniqueId = line.Substring(index + 1);
                    }
                    else if (line.StartsWith("/parentUniqueId:"))
                    {
                        int index = line.IndexOf(':');
                        docItem.ParentUniqueId = line.Substring(index + 1);
                    }
                    else if (line.StartsWith("/symbol:"))
                    {
                        int index = line.IndexOf(':');
                        docItem.Symbol = line.Substring(index + 1);
                    }
                    else if (line == "/content")
                    {
                        if (docItem.Title == null) throw new ArgumentException("Document item should has a title.");
                        if (docItem.UniqueId == null) throw new ArgumentException("Document item should has a unique id.");
                        if (docItem.ParentUniqueId == null) throw new ArgumentException("Document item should has a parent unique id. Use empty for root items.");
                        enterContentMode = true;
                    }
                    else
                    {
                        if (!enterContentMode)
                        {
                            throw new ArgumentException("Don't know how to parse " + line);
                        }
                        else
                        {
                            line = line.Trim();
                            if (line != "")
                            {
                                contentLines.Add(line);
                            }
                        }
                    }
                }
                docItem.Content = DocContentParser.Parse(contentLines, errorLines);
                return docItem;
            }
        }
    }
}
