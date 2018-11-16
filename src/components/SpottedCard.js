import React, { Component } from 'react';
import {
	Text,
	FlatList,
	StyleSheet,
	Dimensions,
	TouchableOpacity,
	TouchableHighlight,
	TextInput,
	Modal,
	AsyncStorage,
	Image
} from 'react-native';
import { Card, CardItem, Left, Right, Body, Thumbnail, Icon, Button, View } from 'native-base';
import { ListItem } from 'react-native-elements';
import Dialog, { DialogButton, SlideAnimation, ScaleAnimation, DialogContent } from 'react-native-popup-dialog';

const { width: viewportWidth, height: viewportHeight } = Dimensions.get('window');
const dimensions = Dimensions.get('window');
const imageHeight = Math.round(dimensions.height);
const imageWidth = dimensions.width;

export default class SpottedCard extends Component {
	
	constructor(props) {
		super(props);
		this.data = props.data;
		this.subcolor = props.subcolor;
		this.color = props.color;
		this.state = {
			newComment: '',
			modalVisibleStatus: false,
			id: this.data.item.id,
			sending: false,
			edit: false,
			openImage: false
		}
	}

	async componentDidMount() {
		try {
		} catch (error) { }
	}

	validadeData(value) {
		return (value != null && value.trim().length != 0);
	}

	renderCard() {
		return (
			<Card style={{ marginBottom: 1, flex: 1 }}>
				<CardItem style={{ backgroundColor: this.subcolor }}>
					<Left style={{ flex: 2 }}>
						<Body style={{ justifyContent: 'center', margin: 1 }}>
							<View style={{ flexDirection: 'row', alignItems: 'center', fontFamily: 'ProductSans', fontSize: 16, color: this.color, margin: 1 }}>
								<Icon style={{ flexDirection: 'row', alignItems: 'center', fontFamily: 'ProductSans', fontSize: 16, color: this.color, margin: 1 }} type="MaterialIcons" name="pin-drop" />
								<Text style={{ flexDirection: 'row', alignItems: 'center', fontFamily: 'ProductSans', fontSize: 16, color: this.color, margin: 1 }}>
									{this.validadeData(this.data.item.location) ? ' ' + this.data.item.location.toUpperCase() : 'DESCONHECIDO'}
								</Text>
							</View>
							<View style={{ flexDirection: 'row', alignItems: 'center', fontFamily: 'ProductSans', fontSize: 16, color: this.color, margin: 1 }}>
								<Icon style={styles.datetime} type="MaterialIcons" name="school" />
								<Text style={styles.datetime}>
									{this.validadeData(this.data.item.course) ? ' ' + this.data.item.course : 'Desconhecido'}
								</Text>
							</View>
							<View style={{ flexDirection: 'row', alignItems: 'center', fontFamily: 'ProductSans', fontSize: 16, color: this.color, margin: 1 }}>
								<Icon style={styles.datetime} type="MaterialIcons" name="access-time" />
								<Text style={styles.datetime}>
									{' ' + this.data.item.datetime}
								</Text>
							</View>
						</Body>
					</Left>
					<Right style={{ flex: 1, fontSize: 17 }} onPress={this.report}>
						<Icon type="MaterialCommunityIcons" name="alert-box" />
					</Right>
				</CardItem>
				<Body>
					<Body style={{ flex: 1 }}>
						{this.renderText()}
						{this.renderImage()}
					</Body>
				</Body>
				<CardItem>
					<Left>
						<Button transparent onPress={() => this.showModalFunction(!this.state.modalVisibleStatus)}>
							<Icon type="MaterialCommunityIcons" name="comment-text-multiple" style={styles.comments} />
							<Text note style={styles.comments}> {this.data.item.comments.length == 0 ? 'Adicionar comentário' : this.data.item.comments.length + ' comentário(s)'}</Text>
						</Button>
					</Left>
				</CardItem>
			</Card>
		);
	}

	renderImage() {
		return (
			<CardItem cardBody>
				<TouchableHighlight style={{ borderRadius: 15 }} onLongPress={() => this.setState({ openImage: true })} onPress={() => this.showModalFunction(!this.state.modalVisibleStatus)}>
					<View style={{ alignItems: 'center' }}>
						<Image source={{ uri: this.data.item.image }}
							style={{ width: imageWidth-10, height: imageHeight-10, borderRadius: 15 }}
						/>
					</View>
				</TouchableHighlight>
			</CardItem>
		);
	}

	renderComments() {
		return (
			<FlatList
				data={this.data.item.comments.sort((a, b) => a.id - b.id)}
				extraData={this.state}
				keyExtractor={item => item.id}
				onEndReachedThreshold={1}
				renderItem={({ item }) => {
					return (
						<View style={styles.item}>
							<ListItem
								containerStyle={{ margin: 1 }}
								title={'@' + item.commenter.username}
								titleStyle={styles.userComment}
								subtitle={
									<View style={styles.subtitleView}>
										<Text style={styles.comment}>{item.comment}</Text>
									</View>
								}
								leftAvatar={{ source: { uri: item.commenter.image } }}
							>
							</ListItem>
						</View>
					);
				}}
				contentContainerStyle={{ width: viewportWidth }}
				ListHeaderComponent={this.renderCard()}
				ListFooterComponent={this.renderFooter()}
			/>
		);
	}

	async commentOptions(value) {
		try {
			const user = await AsyncStorage.getItem('username');
			if (value.commenter.username === user) {
				this.setState({ edit: !this.state.edit });
			}
		} catch(error) {}
	}

	sendComment = async () => {
		try {
			if (this.state.newComment.trim().length != 0) {
				this.setState({ sending: true });
				let userEmail = await AsyncStorage.getItem('email');
				let userPhoto = await AsyncStorage.getItem('photoURL');
				let nickname = await AsyncStorage.getItem('username');
				let userMentioned = this.state.newComment;
				if (userMentioned.indexOf('@') != -1) {
					userMentioned = this.state.newComment.match(/@\w+/g).map(e => e.substr(1));
				} else {
					userMentioned = [];
				}
				await fetch('https://api-spotted.herokuapp.com/api/spotted/' + this.state.id + '/comment', {
					method: 'PUT',
					headers: {
						Accept: 'application/json',
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						usersMentioned: userMentioned,
						comment: this.state.newComment,
						commenter: {
							email: userEmail,
							username: nickname,
							image: userPhoto
						}
					})
				}).then(a => {
					this.data.item.comments.push({
						id: a.id,
						usersMentioned: userMentioned,
						comment: this.state.newComment,
						commenter: {
							email: userEmail,
							username: nickname,
							image: userPhoto
						}
					});
					this.setState({ newComment: '', sending: false });
				});
			}
		} catch (error) {
			this.setState({ sending: false });
		}
	}

	report = async () => {
		try {
			await fetch('https://api-spotted.herokuapp.com/api/spotted/' + this.state.id + '/to-report', {
				method: 'PUT',
				headers: {
					Accept: 'application/json',
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					visible: false
				})
			}).then(a => {
				alert('Reportado!');
			});
		} catch (error) {
			console.error(error);
		}
	}

	renderFooter() {
		return (
			<View style={{ flex: 1, alignItems: 'center' }}>
				<View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', margin: 2 }}>
					<TextInput
						keyboardType="default"
						autoCorrect={false}
						style={styles.input}
						onChangeText={(newComment) => { this.setState({ newComment }) }}
						placeholder=" Adicionar comentário..."
						value={this.state.newComment}
					/>
					<TouchableOpacity
						style={{ justifyContent: 'center', alignItems: 'center', color: 'white', fontSize: 19, fontFamily: 'ProductSans', backgroundColor: this.color, borderColor: '#e7e7e7', borderWidth: 0.5, borderRadius: 10, width: "20%", height: 40, margin: 2, marginRight: 4 }}
						onPress={this.sendComment}
						activeOpacity={0.8}
						disabled={this.state.sending}>
						<Text style={styles.inputText}>
							{this.state.sending ? 'enviando' : 'enviar'}
						</Text>
					</TouchableOpacity>
				</View>
			</View>
		);
	}

	showModalFunction(visible) {
		this.setState({ modalVisibleStatus: visible });
	}

	renderText() {
		return (
			<CardItem>
				<Body>
					<Text style={styles.postText}>{this.data.item.text}</Text>
				</Body>
			</CardItem>
		);
	}

	renderCommentOptions() {
		return (
			<TouchableOpacity onPress={() => this.setState({ edit: false })}>
				<Dialog
    			visible={this.state.edit}
    			onTouchOutside={() => {
      			this.setState({ edit: false });
	    		}}
  	  		dialogAnimation={new SlideAnimation({
    	  		slideFrom: 'bottom',
    			})}
  			>
    			<DialogContent>
      			<Text style={{fontFamily: 'ProductSans', color: 'black'}}>Olá</Text>
    			</DialogContent>
  			</Dialog>
  		</TouchableOpacity>
		)
	}

	renderOpenImage()	 {
		return (
			<View>
				<Dialog
    			visible={this.state.openImage}
    			onTouchOutside={() => {this.setState({ openImage: false })}}
  	  		dialogAnimation={new ScaleAnimation({})}
  	  		dialogStyle={{ width: imageWidth-150, height: imageHeight-150, alignItems: 'center', borderRadius: 15, backgroundColor: 'rgba(0,0,0,0)' }}
  	  		containerStyle={{ blurRadius: 1 }}
  			>
    			<DialogContent>
    				<Image source={{ uri: this.data.item.image }}
							style={{ width: imageWidth-150, height: imageHeight-150, borderRadius: 15 }}
						/>
    			</DialogContent>
  			</Dialog>
  		</View>	
		);
	}

	render() {
		return (
			<View style={{ flex: 1, backgroundColor: this.color }}>
				<TouchableOpacity activeOpacity={0.9} onPress={() => this.showModalFunction(!this.state.modalVisibleStatus)}>
					<View>
						{this.renderCard()}
						<Modal
							transparent={false}
							animationType={"slide"}
							visible={this.state.modalVisibleStatus}
							onRequestClose={() => { this.showModalFunction(!this.state.modalVisibleStatus) }}
							>
							<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
								<View>
									{this.renderComments()}
								</View>
							</View>
						</Modal>
					</View>
				</TouchableOpacity>
				{this.renderOpenImage()}
			</View>
		);
	}
}
const styles = StyleSheet.create({
	item: {
		backgroundColor: 'white',
		margin: 2
	},
	box: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center'
	},
	datetime: {
		fontFamily: 'ProductSans',
		fontSize: 13,
		color: 'gray',
		margin: 1
	},
	comments: {
		fontFamily: 'ProductSans',
		fontSize: 13,
		color: 'gray',
		margin: 5
	},
	comment: {
		fontFamily: 'ProductSans',
		fontSize: 12,
		color: 'gray',
		margin: 1
	},
	subtitleView: {
		flexDirection: 'row',
		margin: 0.5
	},
	input: {
		marginLeft: 4,
		margin: 2,
		height: 40,
		borderColor: '#e0e0e0',
		borderWidth: 1,
		borderRadius: 10,
		width: "80%",
		fontFamily: 'ProductSans'
	},
	inputText: {
		fontFamily: 'ProductSans',
		color: 'white',
		fontSize: 14
	},
	userComment: {
		fontFamily: 'ProductSans',
		color: 'black',
		fontSize: 14
	},
	postText: {
		fontFamily: 'ProductSans',
		textAlign: 'justify',
		margin: 5,
		fontSize: 16
	}
});

