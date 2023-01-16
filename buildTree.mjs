import fs from "fs/promises";

// The buildTree function below addresses the task of rearranging a flat array of objects of type references.
// It takes in a source file with the parameter "sourcePath"  and outputs it to the destination using the
// "destinstionPath" parameter
//
// type references = {
//   nodeId: String,
//   name: string,
//   parentId: string,
//   previousSiblingId: string | null
// }
// 
// type metaData = {
//   hasBeenPlaced: boolean, 
//   isLastNode: boolean, 
//   childrenAreSorted: boolean 
// }

async function buildTree(sourcePath, destinationPath){
  const unsortedNodes = JSON.parse(await fs.readFile(sourcePath, {encoding: "utf-8"}))
  const references = {} // stores the actual nodes
  const metaData = {} // stores metaData for each node
  
  // tree contains the final output of the re arrangement
  let tree = []
  let rootTreeIsSorted = false

  // PHASE 1
  // O(n) -> build reference structures for O(1) node property access
  /**
   * In order to achieve the required solution, there will be frequent access of the properties of each node
   * An array does not lend itself to efficient search and costs linear time worst case to find a node every time.
   * It only costs linear time O(n) once to build the data structures in memory which are needed for frequent 
   * constant time O(1) access
   */
  unsortedNodes.forEach(node => {
    references[node.nodeId] = {...node, children: []}
    metaData[node.nodeId] = {isLastNode: true, childrenAreSorted: false }
  });


  // PHASE 2
  // O(n) -> filter last nodes
  /**
   * The "isLastNode" property is needed for the final phase of sorting. 
   * Every node is considered the last node until proven otherwise.
   * We can determine which node is the last node through elimination.
   * The last noe is the node that is not the previous sibling of any other node
   * 
   * node4 is then found to be the last node in the line below.
   * 
   * node1 <- node2 <- node3 <- node4
   * 
   * since node4 has all the information needed to find all other siblings in the
   * children array it belongs to, we only need information on node4. 
   * 
   */
  unsortedNodes.forEach(node => {
    const previousSiblingRef = references[node.previousSiblingId]
    const previousSiblingMeta = metaData[node.previousSiblingId]
    if (previousSiblingRef) previousSiblingMeta.isLastNode = false
  });


  // PHASE 3
  // Build the tree structure
  /**
   * Sorting is accomplished by loading the previous siblings of each node from the last node in reverse order.
   * Since we loop once, it's likely we have already sorted the children of a parent in a previous step. The goal
   * is not to sort multiple times, we keep track of this using the "childrenAreSorted" property. In the case of root nodes
   * which have no parents, we use the "rooTreeIsSorted" identifier earlier defined
   */
  Object.keys(references).forEach(
    nodeId => {
      let initialNodeRef = references[nodeId]
      let nodeRef = initialNodeRef
      let nodeMeta = metaData[nodeId]

      // since we only use the last nodes to build the tree
      if (nodeMeta.isLastNode){
        let parentRef = references[nodeRef.parentId]
        let parentMeta = metaData[nodeRef.parentId]

        // don't sort multple times
        if (parentRef && parentMeta.childrenAreSorted) return
        if (!parentRef && rootTreeIsSorted) return

        const sortedChildren = []

        // we build the children in reverse order
        while (nodeRef){
          sortedChildren.unshift(nodeRef)
          nodeRef = references[nodeRef.previousSiblingId]
        }

        // place the children where they belong in tree and keep track of this sort using "childrenAreSorted" 
        // and "cootTreeIsSorted" when necessary
        if (initialNodeRef.parentId){
          references[initialNodeRef.parentId].children = sortedChildren
        }else{
          tree = sortedChildren
          rootTreeIsSorted = true
        }
        if (parentRef) parentMeta.childrenAreSorted = true
      }
    }
  );

  // output the result
  fs.writeFile(`${destinationPath}.json`, JSON.stringify(tree, null, 2))
}

// uncomment the line below to run a sample of the code. 
// buildTree("input/nodes.json", "rearranged-tree")
// only include the path without a file extension for the second argument
