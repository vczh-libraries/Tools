using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace GenDocIndex
{
    static class DocItemSorter
    {
        public static Dictionary<string, DocItem> MapItems(DocItem[] inputItems)
        {
            Dictionary<string, DocItem> items = new Dictionary<string, DocItem>();
            string errorLines = "";

            foreach (var item in inputItems)
            {
                if (items.ContainsKey(item.UniqueId))
                {
                    errorLines += string.Format("Duplicate unique id {0} in {1}.\r\n", item.UniqueId, item.Title);
                }
                else
                {
                    items.Add(item.UniqueId, item);
                }
            }
            if (errorLines != "") throw new ArgumentException(errorLines);
            return items;
        }

        public static DocItem[] SortAndGetRootItems(Dictionary<string, DocItem> inputItems)
        {
            string errorLines = "";

            DocItem[] rootItems = inputItems.Values.Where(i => i.ParentUniqueId == "").ToArray();
            foreach (var item in inputItems.Values)
            {
                if (item.ParentUniqueId != "")
                {
                    DocItem parentItem = null;
                    if (inputItems.TryGetValue(item.ParentUniqueId, out parentItem))
                    {
                        parentItem.SubItems.Add(item);
                        item.Parent = parentItem;
                    }
                    else
                    {
                        errorLines += string.Format("Cannot find document item by unique id {0} when finding the parent document item for {1}.\r\n", item.ParentUniqueId, item.Title);
                    }
                }
            }
            if (errorLines != "") throw new ArgumentException(errorLines);
            return rootItems;
        }
    }
}
