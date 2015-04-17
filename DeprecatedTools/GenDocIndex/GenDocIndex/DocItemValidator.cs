using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace GenDocIndex
{
    class DocItemValidationResult
    {
        public DocItem[] DocItems { get; private set; }
        public DocItem[] RootItems { get; private set; }
        public Dictionary<string, DocItem> UniqueIdItemMap { get; private set; }
        public Dictionary<string, DocItem> MemberIdItemMap { get; private set; }

        public DocItemValidationResult(DocItem[] docItems)
        {
            this.DocItems = docItems;
            this.RootItems = docItems.Where(i => i.Parent == null).ToArray();
            this.UniqueIdItemMap = docItems
                .Where(d => !string.IsNullOrWhiteSpace(d.UniqueId))
                .ToDictionary(d => d.UniqueId, d => d);
            this.MemberIdItemMap = docItems
                .Where(d => !string.IsNullOrWhiteSpace(d.Symbol))
                .ToDictionary(d => d.Symbol, d => d);
        }
    }

    static class DocItemValidator
    {
        public static DocItemValidationResult Validate(DocItem[] docItems)
        {
            var result = new DocItemValidationResult(docItems);
            string errorLines = "";
            foreach (var item in docItems)
            {
                foreach (var entity in item.Content.Entities)
                {
                    switch (entity.Type)
                    {
                        case DocEntityType.LinkId:
                            {
                                if (entity.State == DocEntityState.Open)
                                {
                                    if (!result.UniqueIdItemMap.ContainsKey(entity.Argument))
                                    {
                                        errorLines += string.Format("Cannot find document item by unique id {0} when validating /+linkid/s in {1}.\r\n", entity.Argument, item.Title);
                                    }
                                }
                            }
                            break;
                        case DocEntityType.LinkSymbol:
                            {
                                if (entity.State == DocEntityState.Open)
                                {
                                    if (!result.MemberIdItemMap.ContainsKey(entity.Argument))
                                    {
                                        if (entity.Argument.StartsWith("M:"))
                                        {
                                            var methodItems = result
                                                .MemberIdItemMap
                                                .Where(p => p.Key.StartsWith(entity.Argument + "("))
                                                .Select(p => p.Value)
                                                .ToArray();
                                            if (methodItems.Length == 1)
                                            {
                                                entity.Argument = methodItems[0].Symbol;
                                                break;
                                            }
                                        }
                                        errorLines += string.Format("Cannot find document item by symbol {0} when validating /+linksymbol/s in {1}.\r\n", entity.Argument, item.Title);
                                    }
                                }
                            }
                            break;
                    }
                }
            }
            if (errorLines != "")
            {
                throw new ArgumentException(errorLines);
            }
            return result;
        }
    }
}
