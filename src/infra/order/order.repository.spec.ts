import { Sequelize } from "sequelize-typescript";
import { Order } from "../../domain/checkout/entity/order";
import { OrderItem } from "../../domain/checkout/entity/order_item";
import { Customer } from "../../domain/customer/entity/customer";
import { Address } from "../../domain/customer/vo/address";
import { Product } from "../../domain/product/entity/product";
import { CustomerModel } from "../customer/customer.model";
import { CustomerRepository } from "../customer/customer.repository";
import { ProductModel } from "../product/product.model";
import { ProductRepository } from "../product/product.repository";
import { OrderItemModel } from "./order-item.model";
import { OrderModel } from "./order.model";
import { OrderRepository } from "./order.repository";

describe("Order repository test", () => {
  let sequelize: Sequelize;

  beforeEach(async () => {
    sequelize = new Sequelize({
      dialect: "sqlite",
      storage: ":memory:",
      logging: false,
      sync: { force: true },
    });

    await sequelize.addModels([
      CustomerModel,
      OrderModel,
      OrderItemModel,
      ProductModel,
    ]);
    await sequelize.sync();
  });

  afterEach(async () => {
    await sequelize.drop();
    await sequelize.close();
  });

  async function makeOrders(
    { customerId, productId } = { customerId: "123", productId: "123" }
  ) {
    const customerRepository = new CustomerRepository();
    const customer = new Customer(customerId, "Customer 1");
    const address = new Address("Street 1", 1, "Zipcode 1", "City 1");
    customer.changeAddress(address);
    await customerRepository.create(customer);

    const productRepository = new ProductRepository();
    const product = new Product(productId, "Product 1", 10);
    await productRepository.create(product);

    const orderItem = new OrderItem(
      "1",
      product.name,
      product.price,
      product.id,
      2
    );

    return { orderItem };
  }

  it("should create a new order", async () => {
    const { orderItem } = await makeOrders();
    const order = new Order("123", "123", [orderItem]);

    const orderRepository = new OrderRepository();
    await orderRepository.create(order);

    const orderModel = await OrderModel.findOne({
      where: { id: order.id },
      include: ["items"],
    });

    expect(orderModel.toJSON()).toStrictEqual({
      id: "123",
      customer_id: "123",
      total: order.total(),
      items: [
        {
          id: orderItem.id,
          name: orderItem.name,
          price: orderItem.price,
          quantity: orderItem.quantity,
          order_id: "123",
          product_id: "123",
        },
      ],
    });
  });

  it("should update a order", async () => {
    const { orderItem } = await makeOrders();
    const order = new Order("123", "123", [orderItem]);
    const orderRepository = new OrderRepository();
    await orderRepository.create(order);
    order.items[0].changeName("AA AA");
    await orderRepository.update(order);
    const orderModel = await OrderModel.findOne({
      where: { id: order.id },
      include: ["items"],
    });
    expect(orderModel.toJSON()).toStrictEqual({
      id: "123",
      customer_id: "123",
      total: order.total(),
      items: [
        {
          id: orderItem.id,
          name: "AA AA",
          price: orderItem.price,
          quantity: orderItem.quantity,
          order_id: "123",
          product_id: "123",
        },
      ],
    });
  });

  it("should find one order", async () => {
    const { orderItem } = await makeOrders();
    const order = new Order("123", "123", [orderItem]);
    const orderRepository = new OrderRepository();
    await orderRepository.create(order);
    const orderEntity = await orderRepository.find(order.id);
    expect(orderEntity.toJSON()).toStrictEqual({
      id: "123",
      customer_id: "123",
      total: 40,
      items: [
        {
          id: orderItem.id,
          name: "Product 1",
          price: 40,
          quantity: orderItem.quantity,
          order_id: "123",
          product_id: "123",
        },
      ],
    });
  });

  it("should find all order", async () => {
    expect.assertions(2);
    const { orderItem } = await makeOrders();
    const order = new Order("123", "123", [orderItem]);
    const orderRepository = new OrderRepository();
    await orderRepository.create(order);
    const orderEntities = await orderRepository.findAll();
    expect(orderEntities.length).toBe(1);

    for (const orderEntity of orderEntities) {
      expect(orderEntity.toJSON()).toStrictEqual({
        id: "123",
        customer_id: "123",
        total: 40,
        items: [
          {
            id: orderItem.id,
            name: "Product 1",
            price: 40,
            quantity: orderItem.quantity,
            order_id: "123",
            product_id: "123",
          },
        ],
      });
    }
  });
});
