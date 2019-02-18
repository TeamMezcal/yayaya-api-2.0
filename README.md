# yayaya-api-2.0

#PROYECT SPECS:

0.- HTTPS SUPPORT ------------------------------------------> DONE!

1.- Create, update, get and delete USERS -------------------> DONE!

                    BONUS: Should generate a mailing event for user activation.

2.- Create, update, and get TOKENS -------------------------> DONE!

3. Create DISHES:   Should require validation. (valid session)
                    Should include user info.

4.- Create CARTS:   Should require validation. (valid session)
                    Should include user info.
    
    A: GET CARTS: Should require validation (only user that created cart can get cart)
    
    B: PUT CART:  Should require validation (only user that created cart can get cart)
                  Should update when new dish is added/removed

    C: DELETE CART:Should require validation (only user that created cart can get cart)

5. Create ORDER: Should require validation
                 Should include both cart and user info
                 Should generate a payment event (integration with stripe sandbox)
                 Should generate a mailing event: Receipt sent to buyer.



