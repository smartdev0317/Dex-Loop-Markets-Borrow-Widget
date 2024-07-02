import axios from 'axios'

export const fetchMenu = async (cb: Function) => {
    try{
      const response= await axios({
        headers: {
          Accept: 'application/json',
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-cache',
            'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE',
          Authorization:"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOjEsImRhdGEiOnsidXNlcm5hbWUiOiJhdG9tbGF1bmNoIiwiZW1haWwiOiJlcmljQGxpbDJnb29kLmNvbSIsImNyZWF0ZWRfYXQiOiIyMDIxLTA4LTI0IDA3OjU5OjQzIiwidXBkYXRlZF9hdCI6IjIwMjEtMDgtMjQgMDc6NTk6NDMiLCJpZCI6MX0sImlhdCI6MTYyOTgxNzE4M30.4H1VCotSIHHBg2yImuv3DDXDTQkZatkvp2r0rChL1es",
        },
        method: "GET",
        url: 'https://api.loop.markets/v1/menu_v2',
      });
      cb(response.data)
      //   cb([
      //     {
      //         "mainMenu": [
      //             {
      //                 "id": 8,
      //                 "name": "Home",
      //                 "link": "https://www.loop.markets/",
      //                 "active": 1,
      //                 "created_at": "2022-03-10 16:55:20",
      //                 "updated_at": "2022-04-01 05:20:02",
      //                 "menu_type": "main",
      //                 "position": 1
      //             },
      //             {
      //                 "id": 9,
      //                 "name": "Exchange",
      //                 "link": "https://dex.loop.markets/swap#Swap",
      //                 "active": 1,
      //                 "created_at": "2022-03-10 16:55:56",
      //                 "updated_at": "2022-03-31 21:51:00",
      //                 "menu_type": "main",
      //                 "position": 2
      //             },
      //             {
      //                 "id": 17,
      //                 "name": "Borrow",
      //                 "link": "https://defi.loop.markets/",
      //                 "active": 1,
      //                 "created_at": "2022-04-28 20:56:36",
      //                 "updated_at": "2022-04-28 20:56:36",
      //                 "menu_type": "main",
      //                 "position": 3
      //             },
      //             {
      //                 "id": 11,
      //                 "name": "NFTs",
      //                 "link": "https://nft.loop.markets/",
      //                 "active": 1,
      //                 "created_at": "2022-03-10 16:56:54",
      //                 "updated_at": "2022-03-31 21:52:24",
      //                 "menu_type": "main",
      //                 "position": 4
      //             },
      //             {
      //                 "id": 12,
      //                 "name": "Community",
      //                 "link": "https://www.loop.markets/community/",
      //                 "active": 1,
      //                 "created_at": "2022-03-10 16:57:34",
      //                 "updated_at": "2022-03-31 21:54:19",
      //                 "menu_type": "main",
      //                 "position": 5
      //             },
      //             {
      //                 "id": 13,
      //                 "name": "Learn",
      //                 "link": "https://learn.loop.markets",
      //                 "active": 1,
      //                 "created_at": "2022-03-10 16:57:53",
      //                 "updated_at": "2022-04-13 20:24:50",
      //                 "menu_type": "main",
      //                 "position": 6
      //             }
      //         ]
      //     },
      //     {
      //         "subMenu": [
      //             {
      //                 "id": 15,
      //                 "name": "Incubator",
      //                 "link": "https://ventures.loop.markets/",
      //                 "active": 1,
      //                 "created_at": "2022-04-03 22:27:28",
      //                 "updated_at": "2022-04-07 07:12:07",
      //                 "menu_type": "sub",
      //                 "position": 2
      //             },
      //             {
      //                 "id": 16,
      //                 "name": "Investments",
      //                 "link": "https://ventures.loop.markets/",
      //                 "active": 1,
      //                 "created_at": "2022-04-03 22:28:03",
      //                 "updated_at": "2022-04-07 07:11:08",
      //                 "menu_type": "sub",
      //                 "position": 3
      //             },
      //             {
      //                 "id": 14,
      //                 "name": "Docs",
      //                 "link": "https://docs.loop.markets/loop-finance/",
      //                 "active": 1,
      //                 "created_at": "2022-03-10 16:58:14",
      //                 "updated_at": "2022-03-31 21:55:27",
      //                 "menu_type": "sub",
      //                 "position": 7
      //             }
      //         ]
      //     }
      // ])
    }
    catch(err){
      console.log(err)
      cb([]);
    }
}