import { ORDER_STATUS, ORDER_STATUS_TYPE } from "common/constant.common";
import { ERROR } from "common/error.common";
import { IOrder } from "models/order.model";
import { Product } from "models/product.model";
import { startSession } from "mongoose";

export const updateInventory = async (status: ORDER_STATUS_TYPE, order: any) => {
  //to make sure that the whole product stock is re-stocked.
  const session = await startSession();
  session.startTransaction();

  try {
    if (status === ORDER_STATUS.CANCELLED || status === ORDER_STATUS.RETURNED_DELIVERED) {
      if (order && order?.itemsArr?.length) {
        for (const item of order?.itemsArr) {
          // Check if the product exists
          const product = await Product.findOne({ sku: item.sku, isDeleted: false }).exec();
          if (!product) {
            throw new Error(ERROR.PRODUCT.NOT_FOUND);
          }

          let availableQuantity = product.quantity;
          let price = product.price;
          let mrp = product.mrp;
          let productVariant: any = product;

          // Check if there is a variant or subvariant
          if (item.variantId && product.variants?.length) {
            //check the variant available or not
            const variantIndex = product.variants.findIndex(
              (v: any) => v._id.toString() === item.variantId?.toString(),
            );
            if (variantIndex !== -1) {
              availableQuantity = product.variants[variantIndex].quantity;
              price = product.variants[variantIndex].price;
              mrp = product.variants[variantIndex].mrp;
              productVariant = product.variants[variantIndex];

              // If subvariantId is provided, check the subvariant
              if (item.subvariantId && product.variants[variantIndex].subvariants?.length) {
                const subvariantIndex = product.variants[variantIndex].subvariants.findIndex(
                  (sv: any) => sv._id.toString() === item.subvariantId?.toString(),
                );
                if (subvariantIndex !== -1) {
                  availableQuantity = product.variants[variantIndex].subvariants[subvariantIndex].quantity;
                  price = product.variants[variantIndex].subvariants[subvariantIndex].price;
                  mrp = product.variants[variantIndex].subvariants[subvariantIndex].mrp;
                  productVariant = product.variants[variantIndex].subvariants[subvariantIndex];
                }
              }
            }
          }

          //restore the quantity from the product/variant/subvariant
          productVariant.quantity += item.quantity;

          //updating product quantity
          await product.save({ session });
        }
        // Commit the transaction
        await session.commitTransaction();
        session.endSession();
      }
    }
    return true;
  } catch (error) {
    // Abort the transaction in case of an error
    await session.abortTransaction();
    session.endSession();
    return error;
  }
};
