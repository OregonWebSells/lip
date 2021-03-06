---
lip: 1
title: Off-chain API
author: Kevin Hurley (@kphfb), Dmitry Pimenov, George Danezis
status: Draft
type: Informational
created: 05/29/2020
---

# Summary
---
The Off-Chain protocol is an API and payload specification to support compliance, privacy and scalability on blockchains.

---
# Abstract / Motivation
---

The Off-Chain protocol is an API and payload specification to support compliance, privacy and scalability on blockchains.
It is executed between pairs of _Virtual Asset Service Providers_ (VASPs),
such as wallets, exchanges or designated dealers and allows them to privately exchange payment information
before, while, or after settling it on a Blockchain.

The initial use-case for the Off-Chain protocol relates to _supporting compliance_, and in particular the implementation of the _Travel Rule_ recommendation by the FATF. Those recommendations specify that when money transfers above a certain amount are executed by VASPs, some information about the sender and recipient of funds must become available to both VASPs. The Off-Chain protocols allows VASPs to exchange this information privately.

A secondary use-case for the Off-Chain protocol is to provide higher levels of privacy than those that can be achieved directly on a Blockchain. The exact details of the customer accounts involved in a payment, as well as any personal information that needs to be exchanged to support compliance, remain off-chain. They are exchanged within a secure, authenticated and encrypted, channel and only made available to the parties that strictly require them.

In the future, the Off-Chain protocol will be further extended to include functionality such as batching of transactions and additional payments functionality.

---
# Specification
---

# Off-Chain Protocal Design Principles

**Scalability**. In the initial version of the Off-chain protocol all off-chain PaymentObjects that are ready for settlement, are then settled individually (gross) through a separate Blockchain transaction. However, the architecture of the Off-chain protocol allows in the future the introduction of netting batches of transactions, and settling all of them through a single Blockchain transaction. This allows costs associated with multiple on-chain transactions to be kept low for VASPs, and allows for a number of user transactions or payment between VASPs that exceed the capacity of the underlying Blockchain. Additionally, batches enhance privacy via hiding the number of transactions between VASPs and by only placing a single on-chain transaction which hides the individual transaction amounts.

**Extensibility**. The current Off-Chain protocols accommodate simple payments where a customer of a VASP sends funds to the customer of another VASP over a limit, requiring some additional compliance-related information. However, in the future the blockchains may support more complex flows of funds between customers of VASPs as well as merchants. The Off-chain protocol can be augmented to support the transfer of rich meta-data relating to those flows between VASPs in a compliant, secure, private, scalable and extensible manner.

**Generic Communication Framework**. The Off-Chain protocol is designed as a generic communication framework which can be utilized by any Blockchain and requires no ties to any specific blockchain. While the first usage of the Off-Chain protocol is within the Libra Blockchain, the Off-Chain protocol makes few and well defined assumptions about the underlying Blockchain environment, which can be fulfilled by other Blockchains. The Off-chain protocol can therefore be re-purposed to support compliance, privacy and scalability use-cases between VASPs in other Blockchains, as well as in multiple blockchains simultaneously.

We describe a number of additional lower-level requirements throughout the remaining of the documents, such as ease of deployment through the use of established web technologies (like HTTP and JSON), tolerance to delays and crash-recovery failures of either VASPs, and compatibility with common cryptography and serialization schemes.

# Basic Off-Chain Building Blocks

* **HTTP end-points**: Each VASP exposes an HTTPS POST end point at
`https://hostname:port/<protocol_version>/<localVASPAddress>/<RemoteVASPAddress>/command`. It receives `CommandRequestObject`s in the POST body, and responds with `CommandResponseObject`s in the HTTP response (See [Travel Rule Data Exchange](travel_rule_data_exchange.md) for more details. Single command requests-responses are supported (HTTP1.0) but also pipelined request-responses are supported (HTTP1.1). The version for the Off-chain protocol is the string `v1`. All HTTP requests and responses contain a header `X-Request-ID` with a unique ID for the request, used for tracking requests and debugging. Responses must have the same string in the `X-Request-ID` header value as the requests they correspond to.
* **Serialization to JSON**: All structures transmitted, nested within `CommandRequestObject` and `CommandResponseObject` are valid JSON serialized objects and can be parsed and serialized using standard JSON libraries. The content type for requests and responses is set to `Content-type: application/json; charset=utf-8` indicating all content is JSON encoded.
* **JWS Signatures**: all transmitted requests/responses are signed by the sending party using the JWS Signature standard (with the Ed25519 / EdDSA ciphersuite, and `compact` encoding).  The party's compliance key shall be used to sign these messages. This ensures all information and meta-data about payments is authenticated and cannot be repudiated.

### Basic Protocol Interaction
The basic protocol interaction consists of:

* An initiating VASP creates a `CommandRequestObject` containing a PaymentCommand, and sends it to the other VASP, in the body of an HTTP POST.
* The responding VASP listens for requests, and when received, processes them to generate and send `CommandResponseObject` responses, with a success or failure status, through the HTTP response body.
* The initiating VASP receives the response and processes it to assess whether it was successful or not.

All objects contained within a command - for example `PaymentObject`, are considered as "shared objects" - meaning that either VASP may create a new command to modify the object, and will do so during the typical life-cycle of an object - an example being the addition of KYC data from both VASPs to a payment object. Both VASPs in a channel can asynchronously attempt to initiate and execute commands on shared objects. 

As a reminder, all `CommandRequestObject` and `CommandResponseObject` objects sent are signed using JWS Signatures, using EdDSA and compact encoding. Recipients must verify the signatures when receiving any objects.

## Request/Response Payload
All requests between VASPs are structured as [`CommandRequestObject`s](#commandrequestobject) and all responses are structured as [`CommandResponseObject`s](#commandresponseobject).  The resulting request takes a form of the following:

```
{
    "_ObjectType": "CommandRequestObject",
    "command_type": "PaymentCommand", // Command type
    "command": CommandObject(), // Object of type as specified by command_type
}
```

A response would look like the following:
```
{
    "_ObjectType": "CommandResponseObject",
    "status": "success",
}
```

### CommandRequestObject
All requests between VASPs are structured as `CommandRequestObject`s. 

| Field 	| Type 	| Required? 	| Description 	|
|-------	|------	|-----------	|-------------	|
| _ObjectType| str| Y | Fixed value: `CommandRequestObject`|
|command_type | str| Y |A string representing the type of command contained in the request. |
| command | Command object | Y | The command to sequence. |

```
{
    "_ObjectType": "CommandRequestObject",
    "command_type": CommandType,
    "command": CommandObject(),
}
```

### CommandResponseObject
All responses to a CommandRequestObject are in the form of a CommandResponseObject

| Field 	     | Type 	| Required? 	| Description 	|
|-------	     |------	|-----------	|-------------	|
| _ObjectType    | str      | Y             | The fixed string `CommandResponseObject`. |
| status         | str      | Y             | Either `success` or `failure`. |
| error          | List of [OffChainErrorObject](#offchainerrorobject) | N | Details on errors when status == "failure"

```
{
    "_ObjectType": "CommandResponseObject",
    "error": [OffChainErrorObject()],
    "status": "failure"
}
```

When the `CommandResponseObject` status field is `failure`, the `error` field is included in the response to indicate the nature of the failure. The `error` field (type `OffChainError`) is a list of OffChainError objects. 

### OffChainErrorObject
Represents an error that occurred in response to a command.

| Field 	     | Type 	| Required? 	| Description 	|
|-------	     |------	|-----------	|-------------	|
| type    | str (enum)     | Y             | Either "command_error" or "protocol_error" |
| field            | str       | N             | The field on which this error occurred|
| code    | str (enum) | Y    | The error code of the corresponding error |
| message         | str      | N             | Additional details about this error |

```
{
    "type": "command_error",
    "field": "0.sender.kyc_data.surname",
    "code": "missing_data",
    "message": "",
}
```

# Command Sequencing

The low-level Off-Chain protocol allows two VASPs to sequence request-responses for commands originating from either VASP, in order to maintain a consistent database of shared objects. Sequencing a command requires both VAPSs to confirm it is valid, as well as its sequence in relation to other commands operating upon the same objects.  Since commands may operate upon multiple objects, a command only succeeds if the command is able to be applied to every dependent object - ensuring atomicity of the command and consistency of the objects. Both VASPs in a channel can asynchronously attempt to initiate and execute commands on shared objects. All commands upon shared objects which are exchanged between pairs of VASPs are sequenced relative to the prior state of each shared object in the command.


## Object Versioning

When either VASP creates a request, they assign a `_creates_version` to the object being created or mutated.  This string must be a unique random string between this pair of VASPs and is used to represent the version of the item created. These should be at least 16 bytes long and encoded to string in hexadecimal notation using characters in the range[A-Za-z0-9].  Upon every mutation of an object, this string must be updated to a new unique value.

To maintain relative ordering of commands on objects, every creation or mutation of an object must also specify the `_dependencies`.  The value(s) in this field must match a version previously specified by the `_creates_versions` parameter on a prior command and indicates the version(s) being mutated (or in the case of a new object being created which depends on no previous objects, the `_dependencies` list may be empty).  Each version may only be mutated a single time - because once it has been mutated, a new version is created to represent the latest state of the object. This results in what is essentially a per-object sequencing.


## Protocol Server and Client Roles

In each channel, one VASP takes the role of a _protocol server_ and the other the role of a _protocol client_ for the purposes of simplifying shared object locking / state management. Note that these roles are distinct to the HTTP client/server -- and both VASPs act as an HTTP server and client to listen and respond to requests.

Who is the protocol server and who is the client VASP is determined by comparing their binary on-chain Address strings (we call those the _binary address_. The following rules are used to determine which entity serves as which party: The last bit of VASP A’s parent binary address _w_ (where `w = addr[15] & 0x1`) is XOR’d with the last bit in VASP B’s parent binary address _x_.  This results in either 0 or 1.
If the result is 0, the lexicographically lower parent address is used as the server side.
If the result is 1, the lexicographically higher parent address is used as the server side. Lexicographic ordering determines which binary address is higher by comparing byte positions one by one, and returning the address with the first higher byte.

To avoid excessive locking and intermediate state management during API requests, by convention the _server_ acts as the source of truth for the state of an object.  In practice, this means that in the case of lock contention on a shared object, the _server_ command is prioritized.

# Travel Rule Data Exchange

In the initial version of the off-chain APIs, the usage is intended as a means of transferring travel-rule information between VASPs.  The following will detail the request and response payloads utilized for this purpose.

## Request/Response Payload
All requests between VASPs are structured as [`CommandRequestObject`s](basic_building_blocks.md#commandrequestobject) and all responses are structured as [`CommandResponseObject`s](basic_building_blocks.md#commandresponseobject).  For a travel-rule data exchange, the resulting request takes a form of the following:

```
{
    "_ObjectType": "CommandRequestObject",
    "command_type": "PaymentCommand",
    "command": {
	    "_ObjectType": "PaymentCommand",
	    "_creates_versions": [
	        "08697804e12212fa1c979283963d5c71"
	    ],
	    "_dependencies": [],
	    "payment": {
		    "sender": {
			    "address": "lbr1pgfpyysjzgfpyysjzgfpyysjzgf3xycnzvf3xycsm957ne",
			    "kyc_data": {
				    "payload_type": "KYC_DATA"
				    "payload_version": 1,
				    "type": "individual",
				    "given_name": "ben",
				    "surname": "maurer",
				    "address": {
					"city": "Sunnyvale",
					"country": "US",
					"line1": "1234 Maple Street",
					"line2": "Apartment 123",
					"postal_code": "12345",
					"state": "California",
				    },
				    "dob": "1920-03-20",
				    "place_of_birth": {
					"city": "Sunnyvale",
					"country": "US",
					"postal_code": "12345",
					"state": "California",
				    }
				},
			    	"status": {
			    		"status": "ready_for_settlement",
			    	}
			},
		    "receiver": {
			    "address": "lbr1pgfpnegv9gfpyysjzgfpyysjzgf3xycnzvf3xycsmxycyy",
			},
		    "reference_id": "lbr1qg9q5zs2pg9q5zs2pg9q5zs2pgy7gvd9u_ref1001",
		    "action": {
			    "amount": 100,
			    "currency": "USD",
			    "action": "charge",
			    "timestamp": 72322,
			},
		    "description": "A free form or structured description of the payment.",
		},
	},
}
```

A response would look like the following:
```
{
    "_ObjectType": "CommandResponseObject",
    "status": "success",
}
```

### CommandRequestObject
For a travel rule data exchange, the [command_type](basic_building_blocks.md#commandrequestobject) field is set to "PaymentCommand".  The command object is a [`PaymentCommand` object](#paymentcommand-object).

### PaymentCommand object
| Field 	    | Type 	| Required? 	| Description 	|
|-------	    |------	|-----------	|-------------	|
| _ObjectType   | str  | Y             | The fixed string `PaymentCommand` |
| payment| [`PaymentObject`](#paymentobject) | Y | contains a `PaymentObject` that either creates a new payment or updates an existing payment. Note that strict validity check apply when updating payments, that are listed in the section below describing these objects. An invalid update or initial payment object results in a command error
| _creates_versions | list of str |  Y | Must be a list containing a single str representing the version of the new or updated `PaymentObject` resulting from the success of this payment command. A list with any other number of items results in a command error.  This string must be a unique random string between this pair of VASPs and is used to represent the version of the item created. These should be at least 16 bytes long and encoded to string in hexadecimal notation using characters in the range[A-Za-z0-9] |	
| _dependencies | list of str | Y | Can be an empty list or a list containing a single previous version. If the list is empty this payment command defines a new payment. If the list contains one item, then this command updates the shared `PaymentObject` with the given version. It is an error to include more versions, and it results in a command error response.  The value in this field must match a version previously specified by the `_creates_versions` parameter on a prior command. |

```
{
    "_ObjectType": "PaymentCommand",
    "_creates_versions": [
        "08697804e12212fa1c979283963d5c71"
    ],
    "_dependencies": [],
    "payment": {
        PaymentObject(),
    }
}
```

### PaymentObject

The structure in this object can be a full payment or just the fields of an existing payment object that need to be changed. Some fields are immutable after they are defined once (see below). Others can by updated multiple times. Updating immutable fields with a different value results in a command error, but it is acceptable to re-send the same value.

| Field 	    | Type 	| Required? 	| Description 	|
|-------	    |------	|-----------	|-------------	|
| sender/receiver | [`PaymentActorObject`](#paymentactorobject) | Required for payment creation | Information about the sender/receiver in this payment |
| reference_id | str | Y | Unique reference ID of this payment on the payment initiator VASP (the VASP which originally created this payment object). This value should be unique, and formatted as “<creator_vasp_onchain_address_bech32>_<unique_id>”.  For example, ”lbr1x23456abcd_seqABCD“. This field is mandatory on payment creation and immutable after that. |
| original_payment_reference_id | str | N | Used for updates to a payment after it has been committed on chain. For example, used for refunds. The reference ID of the original payment will be placed into this field. This value is optional on payment creation and invalid on updates. |
| recipient_signature | str | N | Signature of the recipient of this transaction. The signature is over the LCS serialized representation of `reference_id`, `sender_address`, `amount` and is signed with the compliance key of the recipient VASP.  This is used for on-chain attestation from the recipient party.  This may be omitted on blockchains which do not require on-chain attestation |
| action | [`PaymentActionObject`](#paymentactionobject) | Y | Number of cryptocurrency + currency type (USD, LBR, EUR, BTC, etc.) + type of action to take. This field is mandatory and immutable |
| description | str | N | Description of the payment. To be displayed to the user. Unicode utf-8 encoded max length of 255 characters. This field is optional but can only be written once.

```
{
    "sender": payment_actor_object(),
    "receiver": payment_actor_object(),
    "reference_id": "lbr1qg9q5zs2pg9q5zs2pg9q5zs2pgy7gvd9u_ref1001",
    "original_payment_reference_id": "lbr1qg9q5zs2pg9q5zs2pg9q5zs2pgy7gvd9u_ref0987",
    "recipient_signature": "...",
    "action": payment_action_object(),
    "description": "A free form or structured description of the payment.",
}
```

### PaymentActorObject

A `PaymentActorObject` represents a participant in a payment - either sender or receiver. It also includes the status of the actor, indicates missing information or willingness to settle or abort the payment, and the Know-Your-Customer information of the customer involved in the payment.

| Field 	    | Type 	| Required? 	| Description 	|
|-------	    |------	|-----------	|-------------	|
| address | str | Y | Address of the sender/receiver account. Addresses may be single use or valid for a limited time, and therefore VASPs should not rely on them remaining stable across time or different VASP addresses. The addresses are encoded using bech32. The bech32 address encodes both the address of the VASP as well as the specific user's subaddress. They should be no longer than 80 characters. Mandatory and immutable. For Libra addresses, refer to (TODO) for format. |
| kyc_data | [KycDataObject](#kycdataobject) | N | The KYC data for this account. This field is optional but immutable once it is set. |
| status | [StatusObject](#statusobject) | Y | Status of the payment from the perspective of this actor. This field can only be set by the respective sender/receiver VASP and represents the status on the sender/receiver VASP side. This field is mandatory by this respective actor (either sender or receiver side) and mutable. |
| metadata | list of str | Y | Can be specified by the respective VASP to hold metadata that the sender/receiver VASP wishes to associate with this payment. This is a mandatory field but can be set to an empty list (i.e. `[]`). New string-typed entries can be appended at the end of the list, but not deleted.	
| metadata | list of str | Y | Can be specified by the respective VASP to hold metadata that the sender/receiver VASP wishes to associate with this payment. This is a mandatory field but can be set to an empty list (i.e. `[]`). New string-typed entries can be appended at the end of the list, but not deleted.

```
{
    "address": "lbr1pgfpyysjzgfpyysjzgfpyysjzgf3xycnzvf3xycsm957ne",
    "kyc_data": kyc_data_object(),
    "status": status_object(),
    "metadata": [],
}
```

### KYCDataObject
A `KYCDataObject` represents the KYC data for a single subaddress.  Proof of non-repudiation is provided by the signatures included in the JWS payloads.  The only mandatory fields are `payload_type`, `payload_version` and `type`. All other fields are optional from the point of view of the protocol -- however they may need to be included for another VASP to be ready to settle the payment.

| Field 	    | Type 	| Required? 	| Description 	|
|-------	    |------	|-----------	|-------------	|
| payload_type | str | Y | Used to help determine what type of data this will deserialize into.  Always set to KYC_DATA. |
| payload_version | str | Y | Version identifier to allow modifications to KYC data object without needing to bump version of entire API set.  Set to 1 |
| type | str | Y | Required field, must be either “individual” or “entity” |
| given_name | str | N | Legal given name of the user for which this KYC data object applies. |
| surname | str | N | Legal surname of the user for which this KYC data object applies. |
| address | [AddressObject](#addressobject) | N | Physical address data for this account |
| dob | str | N | Date of birth for the holder of this account.  Specified as an ISO 8601 calendar date format: https://en.wikipedia.org/wiki/ISO_8601 |
| place_of_birth | [AddressObject](#addressobject) | N | Place of birth for this user.  line1 and line2 fields should not be populated for this usage of the address object |
| national_id | [NationalIdObject](#nationalidobject) | N | National ID information for the holder of this account |
| legal_entity_name | str | N | Name of the legal entity.  Used when subaddress represents a legal entity rather than an individual. KYCDataObject should only include one of legal_entity_name OR given_name/surname |
| additional_kyc_data | str | N | Freeform KYC data.  If a soft-match occurs, this field should be used to specify additional KYC data which can be used to clear the soft-match.  It is suggested that this data be JSON, XML, or another human-readable form.

```
{
    "payload_type": "KYC_DATA"
    "payload_version": 1,
    "type": "individual",
    "given_name": "ben",
    "surname": "maurer",
    "address": {
        AddressObject(),
    },
    "dob": "1920-03-20",
    "place_of_birth": {
        AddressObject(),
    }
    "national_id": {
    },
}
```

### AddressObject
Represents a physical address

| Field 	    | Type 	| Required? 	| Description 	|
|-------	    |------	|-----------	|-------------	|
| city | str | N | The city, district, suburb, town, or village |
| country | str | N | Two-letter country code (https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2) |
| line1 | str | N | Address line 1 |
| line2 | str | N | Address line 2 - apartment, unit, etc.|
| postal_code| str | N | ZIP or postal code |
| state | str | N | State, county, province, region.

```
{
    "city": "Sunnyvale",
    "country": "US",
    "line1": "1234 Maple Street",
    "line2": "Apartment 123",
    "postal_code": "12345",
    "state": "California",
}
```

### NationalIdObject
Represents a national ID.

| Field 	    | Type 	| Required? 	| Description 	|
|-------	    |------	|-----------	|-------------	|
| id_value | str | Y | Indicates the national ID value - for example, a social security number |
| country | str | N | Two-letter country code (https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2) |
| type | str | N | Indicates the type of the ID |

```
{
    "id_value": "123-45-6789",
    "country": "US",
    "type": "SSN",
}
```


### PaymentActionObject

| Field 	    | Type 	| Required? 	| Description 	|
|-------	    |------	|-----------	|-------------	|
| amount | uint | Y | Amount of the transfer.  Base units are the same as for on-chain transactions for this currency.  For example, if LibraUSD is represented on-chain where “1” equals 1e-6 dollars, then “1” equals the same amount here.  For any currency, the on-chain mapping must be used for amounts. |
| currency | enum | Y | One of the supported on-chain currency types - ex. LBR, BTC, USD, EUR, etc. |
| action | enum | Y | Populated in the request.  This value indicates the requested action to perform, and the only valid value is `charge`. |
| timestamp | uint | Y | Unix timestamp indicating the time that the payment command was created.

```
{
    "amount": 100,
    "currency": "USD",
    "action": "charge",
    "timestamp": 72322,
}
```

### StatusObject

| Field 	    | Type 	| Required? 	| Description 	|
|-------	    |------	|-----------	|-------------	|
| status | str enum | Y | Status of the payment from the perspective of this actor. This field can only be set by the respective sender/receiver VASP and represents the status on the sender/receiver VASP side. This field is mandatory by this respective actor (either sender or receiver side) and mutable. Valid values are specified in [ StatusEnum ](#statusenum)  |
| abort_code    | str (enum) | N    | In the case of an `abort` status, this field may be used to describe the reason for the abort. Represents the error code of the corresponding error |
| abort_message         | str      | N             | Additional details about this error.  To be used only when `code` is populated |

```
{
    "status": "needs_kyc_data",
}
```

### StatusEnum
Valid values are:
* `none` - No status is yet set from this actor.
* `needs_kyc_data` - KYC data about the subaddresses is required by this actor.
* `needs_recipient_signature` - Can only be associated with the sender actor.  Means that the sender still requires that the recipient VASP provide the signature so that the transaction can be put on-chain.
* `ready_for_settlement` - Transaction is ready for settlement according to this actor (i.e. the required signatures/KYC data have been provided)
* `settled` - Payment has been settled on chain and funds delivered to the subaddress
* `abort` - Indicates the actor wishes to abort this payment, instead of settling it.
* `pending_review` - Payment is pending review.
* `soft_match` - Actor's KYC data resulted in a soft-match.  The VASP associated with this actor should send any available KYC information which may clear the soft-match via the KYCObject field of `additional_kyc_data`.  If not sent within SLA window, this transaction will be aborted.

**Valid Status Transitions**. Each side of the transaction is only allowed to mutate their own status (sender or receiver), and upon payment creation may only set the status of the other party to `none`. Subsequently, each party may only modify their own state to a higher or equal state in the order `none`, (`needs_kyc_data`, `needs_recipient_signature`, `abort`, `pending_review`), (`soft_match`, `ready_for_settlement`, `abort`), and `settled`. A status of `abort` and `settle` is terminal and must not be changed. As a consequence of this ordering of valid status updates once a transaction is in a `ready_for_settlement` state by both parties it cannot be aborted any more and can be considered final from the point of view of the off-chain protocol. It is therefore safe for a VASP sending funds to initiate an On-Chain payment to settle an Off-chain payment after it observed the other party setting their status to `ready_for_settlement` and it is also willing to go past this state.

A state of `pending_review` may exist due to manual review. This state may result in any of `soft_match`, `ready_for_settlement`, or `abort`.

A state of `soft_match` requires that the VASP associated with this actor must send all available KYC data via `additional_kyc_data`.  After human review of this data, this state may result in any of `ready_for_settlement` or `abort` (`abort` if the soft-match was unable to be cleared).  If data is not received within a reasonable SLA (suggested to be 24 hours), this state will result in `abort`.  The party who needs to provide KYC data is also allowed to `abort` the transaction at any point if they do not have additional KYC data or do not wish to supply it.




