import { Document, Model, PipelineStage, Types } from "mongoose";
import { paginationProcessor } from "./queryProcessors";
import _ from "lodash";

export async function paginateAggregate<T = unknown>(
  model: Model<T, {}, {}, {}, Document<unknown, {}, T> & T & { _id: Types.ObjectId }, any>,
  pipeline: PipelineStage[],
  query: any,
) {
  const obj: { data: unknown[]; total: number } = {
    data: [],
    total: 0,
  };

  const pagination = paginationProcessor(query);
  const countPipeline = _.cloneDeep(pipeline);

  pipeline.push(
    {
      $skip: pagination.skip,
    },
    {
      $limit: pagination.pageSize,
    },
  );
  obj.data = await model.aggregate(pipeline);

  countPipeline.push({
    $count: "count",
  });
  let countResult = await model.aggregate(countPipeline);
  obj.total = countResult.length > 0 ? countResult[0].count : 0;

  return obj;
}
